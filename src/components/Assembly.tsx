import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  ChevronDown,
  Wrench,
  X,
  CheckCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { db, supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

interface AssemblyRecipe {
  id: string;
  product_id: string;
  product_name: string;
  ingredients: AssemblyIngredient[];
  transaction_history: AssemblyTransaction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AssemblyIngredient {
  product_id: string;
  product_name: string;
  quantity_required: number;
  unit: string;
}

interface AssemblyTransaction {
  id: string;
  quantity_produced: number;
  assembled_at: string;
  assembled_by: string;
  notes?: string;
  ingredients_used: AssemblyIngredientUsed[];
}

interface AssemblyIngredientUsed {
  product_id: string;
  product_name: string;
  quantity_used: number;
  unit: string;
}

const Assembly: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"recipes" | "assemble">("recipes");
  const [recipes, setRecipes] = useState<AssemblyRecipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRecipeForm, setShowAddRecipeForm] = useState(false);
  const [showAssembleForm, setShowAssembleForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<AssemblyRecipe | null>(
    null
  );
  const [selectedRecipeLogs, setSelectedRecipeLogs] = useState<any[]>([]);
  const [assemblyLogs, setAssemblyLogs] = useState<any[]>([]);
  const [assemblyStats, setAssemblyStats] = useState({
    totalAssemblies: 0,
    totalProducts: 0,
  });
  const [recipeLogsLoading, setRecipeLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("");
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<AssemblyRecipe | null>(
    null
  );

  // Form states
  const [newRecipe, setNewRecipe] = useState({
    product_id: "",
    product_name: "",
    ingredients: [] as AssemblyIngredient[],
    cost: 0,
  });

  const [assembleForm, setAssembleForm] = useState({
    recipe_id: "",
    quantity: 1,
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from("assembly_recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;

      // Parse JSON fields
      const parsedRecipes = (recipesData || []).map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients || [],
      }));

      setRecipes(parsedRecipes);

      const [rawMaterialsData, finishedGoodsData] = await Promise.all([
        db.products.getRawMaterials(),
        db.products.getFinishedGoods(),
      ]);
      setRawMaterials(rawMaterialsData);
      setFinishedGoods(finishedGoodsData);

      await fetchAssemblyLogs();
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeLogs = async (recipeId: string) => {
    setRecipeLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from("assembly_logs")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("assembled_at", { ascending: false });

      if (error) throw error;

      const parsedLogs = (data || []).map((log) => ({
        ...log,
        ingredients_used: log.ingredients_used || [],
      }));

      setSelectedRecipeLogs(parsedLogs);
    } catch (error) {
      console.error("Error fetching recipe logs:", error);
      setSelectedRecipeLogs([]);
    } finally {
      setRecipeLogsLoading(false);
    }
  };

  const fetchAssemblyLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("assembly_logs")
        .select(
          `
          *,
          recipe:assembly_recipes(product_name, product_id, product:products(unit))
        `
        )
        .order("assembled_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAssemblyLogs(data || []);

      const totalAssemblies = data?.length || 0;
      const totalProducts =
        data?.reduce((sum, log) => sum + log.quantity_produced, 0) || 0;
      setAssemblyStats({ totalAssemblies, totalProducts });
    } catch (error) {
      console.error("Error fetching assembly logs:", error);
    }
  };

  const handleToggleRecipeStatus = async (recipe: AssemblyRecipe) => {
    try {
      const newStatus = !recipe.is_active;
      const { error } = await supabase
        .from("assembly_recipes")
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recipe.id);

      if (error) throw error;

      Swal.fire(
        "Berhasil",
        `Resep ${newStatus ? "diaktifkan" : "dinonaktifkan"}`,
        "success"
      );
      fetchData();
    } catch (error) {
      console.error("Error toggling recipe status:", error);
      Swal.fire("Error", "Gagal mengubah status resep", "error");
    }
  };

  const handleEditRecipe = async () => {
    if (!editingRecipe) return;

    if (!newRecipe.product_id || newRecipe.ingredients.length === 0) {
      Swal.fire("Error", "Pilih produk dan tambahkan bahan", "error");
      return;
    }

    try {
      // Calculate cost
      let finalCost = newRecipe.cost;
      if (finalCost === 0) {
        let estimatedCost = 0;
        for (const ingredient of newRecipe.ingredients) {
          const material = rawMaterials.find(
            (m) => m.id === ingredient.product_id
          );
          if (material) {
            estimatedCost += material.cost * ingredient.quantity_required;
          }
        }
        finalCost = estimatedCost;
      }

      // Update cost
      if (finalCost > 0) {
        await db.products.update(newRecipe.product_id, { cost: finalCost });
      }

      const { error } = await supabase
        .from("assembly_recipes")
        .update({
          product_id: newRecipe.product_id,
          product_name: newRecipe.product_name,
          ingredients: newRecipe.ingredients,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRecipe.id);

      if (error) throw error;

      Swal.fire("Berhasil", "Resep berhasil diperbarui", "success");
      setShowAddRecipeForm(false);
      setIsEditMode(false);
      setEditingRecipe(null);
      setNewRecipe({
        product_id: "",
        product_name: "",
        ingredients: [],
        cost: 0,
      });
      fetchData();
    } catch (error) {
      console.error("Error editing recipe:", error);
      Swal.fire("Error", "Gagal memperbarui resep", "error");
    }
  };

  const handleDeleteRecipe = async (recipe: AssemblyRecipe) => {
    // Cek apakah recipe sudah pernah digunakan
    const hasAssemblyLogs = assemblyLogs.some(
      (log) => log.recipe_id === recipe.id
    );

    if (hasAssemblyLogs) {
      Swal.fire({
        title: "Tidak Dapat Dihapus",
        text: "Resep ini sudah pernah digunakan untuk assembly. Nonaktifkan saja jika tidak ingin digunakan lagi.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Hapus Resep?",
      text: `Apakah Anda yakin ingin menghapus resep "${recipe.product_name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc3545",
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("assembly_recipes")
        .delete()
        .eq("id", recipe.id);

      if (error) throw error;

      Swal.fire("Berhasil", "Resep berhasil dihapus", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      Swal.fire("Error", "Gagal menghapus resep", "error");
    }
  };

  const handleAddRecipe = async () => {
    if (!newRecipe.product_id || newRecipe.ingredients.length === 0) {
      Swal.fire("Error", "Pilih produk dan tambahkan bahan", "error");
      return;
    }

    try {
      let finalCost = newRecipe.cost;
      if (finalCost === 0) {
        let estimatedCost = 0;
        for (const ingredient of newRecipe.ingredients) {
          const material = rawMaterials.find(
            (m) => m.id === ingredient.product_id
          );
          if (material) {
            estimatedCost += material.cost * ingredient.quantity_required;
          }
        }
        finalCost = estimatedCost;
      }

      // Update cost
      if (finalCost > 0) {
        await db.products.update(newRecipe.product_id, { cost: finalCost });
      }

      const { error } = await supabase.from("assembly_recipes").insert({
        product_id: newRecipe.product_id,
        product_name: newRecipe.product_name,
        ingredients: newRecipe.ingredients,
        is_active: true,
      });

      if (error) throw error;

      Swal.fire("Berhasil", "Resep berhasil ditambahkan", "success");
      setShowAddRecipeForm(false);
      setNewRecipe({
        product_id: "",
        product_name: "",
        ingredients: [],
        cost: 0,
      });
      fetchData();
    } catch (error) {
      console.error("Error adding recipe:", error);
      Swal.fire("Error", "Gagal menambah resep", "error");
    }
  };

  const handleAssemble = async () => {
    if (!assembleForm.recipe_id || assembleForm.quantity <= 0) {
      Swal.fire("Error", "Pilih resep dan jumlah yang valid", "error");
      return;
    }

    const recipe = recipes.find((r) => r.id === assembleForm.recipe_id);
    if (!recipe) return;

    try {
      // Check stock availability
      for (const ingredient of recipe.ingredients) {
        const product = rawMaterials.find(
          (p) => p.id === ingredient.product_id
        );
        const required = ingredient.quantity_required * assembleForm.quantity;

        if (!product || product.stock < required) {
          Swal.fire(
            "Error",
            `Stok ${
              ingredient.product_name
            } tidak cukup. Dibutuhkan: ${required} ${ingredient.unit}
            }, Tersedia: ${product?.stock || 0}`,
            "error"
          );
          return;
        }
      }

      // Confirm assembly
      const result = await Swal.fire({
        title: "Konfirmasi Assembly",
        text: `Merakit ${assembleForm.quantity} ${recipe.product_name}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Rakit",
        cancelButtonText: "Batal",
      });

      if (!result.isConfirmed) return;

      // Decrease ingredient stocks
      for (const ingredient of recipe.ingredients) {
        const required = ingredient.quantity_required * assembleForm.quantity;
        await db.products.decreaseStock(ingredient.product_id, required);
      }

      // Increase finished product stock
      await db.products.increaseStock(recipe.product_id, assembleForm.quantity);

      // Create transaction record
      const { error: logError } = await supabase.from("assembly_logs").insert({
        recipe_id: recipe.id,
        quantity_produced: assembleForm.quantity,
        assembled_at: new Date().toISOString(),
        assembled_by: user?.full_name || user?.username,
        notes: assembleForm.notes,
        ingredients_used: recipe.ingredients.map((ing) => ({
          product_id: ing.product_id,
          product_name: ing.product_name,
          quantity_used: ing.quantity_required * assembleForm.quantity,
          unit: ing.unit,
        })),
      });

      if (logError) throw logError;

      Swal.fire("Berhasil", "Assembly berhasil!", "success");
      setShowAssembleForm(false);
      setAssembleForm({ recipe_id: "", quantity: 1, notes: "" });
      fetchData();
    } catch (error) {
      console.error("Error assembling:", error);
      Swal.fire("Error", "Gagal merakit produk", "error");
    }
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const removeIngredient = (index: number) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat data assembly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Assembly & Produksi
        </h1>
        <p className="text-gray-600">
          Kelola resep dan proses perakitan produk
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("recipes")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "recipes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Kelola Resep
            </button>
            <button
              onClick={() => setActiveTab("assemble")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "assemble"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Wrench className="w-4 h-4 inline mr-2" />
              Rakit Produk
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === "recipes" && (
        <div>
          {/* Recipes Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">Resep Produksi</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari resep..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowAddRecipeForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Resep
            </button>
          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {recipe.product_name}
                    </h3>

                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <button
                        onClick={() => handleToggleRecipeStatus(recipe)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          recipe.is_active ? "bg-green-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            recipe.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            recipe.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {recipe.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditMode(true);
                        setEditingRecipe(recipe);
                        setNewRecipe({
                          product_id: recipe.product_id,
                          product_name: recipe.product_name,
                          ingredients: [...recipe.ingredients],
                          cost:
                            finishedGoods.find(
                              (p) => p.id === recipe.product_id
                            )?.cost || 0,
                        });
                        setShowAddRecipeForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit Resep"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* <button
                      onClick={() => handleToggleRecipeStatus(recipe)}
                      className={`p-2 rounded-lg transition-colors ${
                        recipe.is_active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      title={
                        recipe.is_active
                          ? "Nonaktifkan Resep"
                          : "Aktifkan Resep"
                      }
                    >
                      {recipe.is_active ? "🟢" : "⚪"}
                    </button> */}

                    <button
                      onClick={() => handleDeleteRecipe(recipe)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Hapus Resep"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-sm text-gray-600">
                    Bahan ({recipe.ingredients.length}):
                  </p>
                  {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                    <div key={idx} className="text-sm text-gray-500">
                      • {ing.quantity_required} {ing.unit} {ing.product_name}
                    </div>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-sm text-gray-500">
                      ... dan {recipe.ingredients.length - 3} bahan lainnya
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Dibuat:{" "}
                    {new Date(recipe.created_at).toLocaleDateString("id-ID")}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      fetchRecipeLogs(recipe.id);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada resep.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "assemble" && (
        <div>
          {/* Assemble Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Rakit Produk</h2>
            <button
              onClick={() => setShowAssembleForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Mulai Assembly
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Resep</p>
                  <p className="text-2xl font-bold">{recipes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Wrench className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Assembly</p>
                  <p className="text-2xl font-bold">
                    {assemblyStats.totalAssemblies}
                  </p>
                </div>
              </div>
            </div>
            {/* <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Produk Dirakit</p>
                  <p className="text-2xl font-bold">
                    {assemblyStats.totalProducts}
                  </p>
                </div>
              </div>
            </div> */}
          </div>

          {/* Recent Assemblies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Riwayat Assembly Terbaru
            </h3>
            <div className="space-y-4">
              {assemblyLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">
                      {log.recipe?.product_name || "Unknown Product"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {log.quantity_produced}{" "}
                      {log.recipe?.product?.unit || "pcs"} •{" "}
                      {new Date(log.assembled_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              ))}
              {assemblyLogs.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Belum ada riwayat assembly
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Modal */}
      {showAddRecipeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* <h3 className="text-lg font-semibold mb-4">Tambah Resep Baru</h3> */}
              <h3 className="text-lg font-semibold mb-4">
                {isEditMode ? "Edit Resep" : "Tambah Resep Baru"}
              </h3>

              {/* Product Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produk Jadi
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span
                      className={
                        newRecipe.product_name
                          ? "text-gray-900"
                          : "text-gray-500"
                      }
                    >
                      {newRecipe.product_name || "Pilih produk jadi..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {newRecipe.product_name && (
                    <button
                      type="button"
                      onClick={() =>
                        setNewRecipe((prev) => ({
                          ...prev,
                          product_id: "",
                          product_name: "",
                        }))
                      }
                      className="absolute right-10 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bahan-bahan (Raw Materials)
                  </label>
                  <button
                    onClick={() => setShowIngredientModal(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Bahan
                  </button>
                </div>

                <div className="space-y-3">
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {ingredient.product_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {ingredient.product_id}
                        </div>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Jumlah"
                        value={ingredient.quantity_required || ""}
                        onChange={(e) =>
                          updateIngredient(
                            index,
                            "quantity_required",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-sm text-gray-600 px-2">
                        {ingredient.unit}
                      </span>
                      {/* <select
                        value={ingredient.unit}
                        onChange={(e) =>
                          updateIngredient(index, "unit", e.target.value)
                        }
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="pcs">pcs</option>
                        <option value="gram">gram</option>
                        <option value="ml">ml</option>
                        <option value="kg">kg</option>
                        <option value="liter">liter</option>
                      </select> */}
                      <button
                        onClick={() => removeIngredient(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Preview Cost */}
                {newRecipe.ingredients.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Estimasi Cost Produk Jadi:</strong>
                        <div className="mt-1 text-lg font-semibold">
                          Rp{" "}
                          {(() => {
                            let total = 0;
                            for (const ingredient of newRecipe.ingredients) {
                              const material = rawMaterials.find(
                                (m) => m.id === ingredient.product_id
                              );
                              if (material) {
                                total +=
                                  material.cost * ingredient.quantity_required;
                              }
                            }
                            return total.toLocaleString("id-ID");
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Cost Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Produk Jadi (Rp)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Masukkan cost produk jadi"
                        value={newRecipe.cost || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setNewRecipe((prev) => ({
                            ...prev,
                            cost: value,
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Kosongkan untuk menggunakan estimasi cost
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddRecipeForm(false);
                    setIsEditMode(false);
                    setEditingRecipe(null);
                    setNewRecipe({
                      product_id: "",
                      product_name: "",
                      ingredients: [],
                      cost: 0,
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={isEditMode ? handleEditRecipe : handleAddRecipe}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {/* Simpan Resep */}
                  {isEditMode ? "Update Resep" : "Simpan Resep"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assemble Modal */}
      {showAssembleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rakit Produk</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Resep
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRecipeModal(true)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                    >
                      <span
                        className={
                          assembleForm.recipe_id
                            ? "text-gray-900"
                            : "text-gray-500"
                        }
                      >
                        {assembleForm.recipe_id
                          ? recipes.find((r) => r.id === assembleForm.recipe_id)
                              ?.product_name || "Resep tidak ditemukan"
                          : "Pilih resep..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {assembleForm.recipe_id && (
                      <button
                        type="button"
                        onClick={() =>
                          setAssembleForm((prev) => ({
                            ...prev,
                            recipe_id: "",
                          }))
                        }
                        className="absolute right-10 top-3 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah yang akan dirakit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={assembleForm.quantity}
                    onChange={(e) =>
                      setAssembleForm((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={assembleForm.notes}
                    onChange={(e) =>
                      setAssembleForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>

              {assembleForm.recipe_id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Bahan yang dibutuhkan:</h4>
                  {(() => {
                    const recipe = recipes.find(
                      (r) => r.id === assembleForm.recipe_id
                    );
                    return recipe?.ingredients.map((ing, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        • {ing.quantity_required * assembleForm.quantity}{" "}
                        {ing.unit} {ing.product_name}
                      </div>
                    ));
                  })()}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => {
                    setShowAssembleForm(false);
                    setAssembleForm({ recipe_id: "", quantity: 1, notes: "" });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssemble}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Rakit Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedRecipe.product_name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedRecipe(null);
                    setSelectedRecipeLogs([]);
                    setRecipeLogsLoading(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Bahan-bahan:</h4>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span>{ing.product_name}</span>
                        <span className="text-sm text-gray-600">
                          {ing.quantity_required} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Riwayat Assembly:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recipeLogsLoading ? (
                      <div className="text-center py-4">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">
                          Memuat riwayat...
                        </p>
                      </div>
                    ) : selectedRecipeLogs.length > 0 ? (
                      selectedRecipeLogs.map((log, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">
                              {log.quantity_produced}{" "}
                              {log.recipe?.product?.unit}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(log.assembled_at).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-gray-600">{log.notes}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Oleh: {log.assembled_by}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Belum ada riwayat assembly
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pilih Produk Jadi</h3>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setProductSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {finishedGoods
                    .filter((product) =>
                      product.name
                        .toLowerCase()
                        .includes(productSearchTerm.toLowerCase())
                    )
                    .map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setNewRecipe((prev) => ({
                            ...prev,
                            product_id: product.id,
                            product_name: product.name,
                          }));
                          setShowProductModal(false);
                          setProductSearchTerm("");
                        }}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Stok: {product.stock} | Harga: Rp{" "}
                              {product.price?.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-600 font-medium">
                              Produk Jadi
                            </div>
                            {product.barcode && (
                              <div className="text-xs text-gray-400">
                                Barcode: {product.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
                {finishedGoods.filter((product) =>
                  product.name
                    .toLowerCase()
                    .includes(productSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada produk jadi ditemukan</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setProductSearchTerm("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Selection Modal */}
      {showIngredientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pilih Bahan Baku</h3>
                <button
                  onClick={() => {
                    setShowIngredientModal(false);
                    setIngredientSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari bahan baku..."
                    value={ingredientSearchTerm}
                    onChange={(e) => setIngredientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Ingredient List */}
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {rawMaterials
                    .filter((material) =>
                      material.name
                        .toLowerCase()
                        .includes(ingredientSearchTerm.toLowerCase())
                    )
                    .map((material) => (
                      <button
                        key={material.id}
                        onClick={() => {
                          // Cek apakah bahan sudah ada di ingredients
                          const exists = newRecipe.ingredients.some(
                            (ing) => ing.product_id === material.id
                          );
                          if (exists) {
                            Swal.fire(
                              "Warning",
                              "Bahan ini sudah ditambahkan",
                              "warning"
                            );
                            return;
                          }

                          setNewRecipe((prev) => ({
                            ...prev,
                            ingredients: [
                              ...prev.ingredients,
                              {
                                product_id: material.id,
                                product_name: material.name,
                                quantity_required: 0,
                                unit: material.unit || "pcs",
                              },
                            ],
                          }));
                          setShowIngredientModal(false);
                          setIngredientSearchTerm("");
                        }}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {material.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Stok: {material.stock} | Harga: Rp{" "}
                              {material.cost?.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-orange-600 font-medium">
                              Bahan Baku
                            </div>
                            {material.barcode && (
                              <div className="text-xs text-gray-400">
                                Barcode: {material.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
                {rawMaterials.filter((material) =>
                  material.name
                    .toLowerCase()
                    .includes(ingredientSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada bahan baku ditemukan</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => {
                    setShowIngredientModal(false);
                    setIngredientSearchTerm("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Selection Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pilih Resep Assembly</h3>
                <button
                  onClick={() => {
                    setShowRecipeModal(false);
                    setRecipeSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari resep..."
                    value={recipeSearchTerm}
                    onChange={(e) => setRecipeSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Recipe List */}
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {recipes
                    .filter(
                      (recipe) =>
                        recipe.is_active &&
                        recipe.product_name
                          .toLowerCase()
                          .includes(recipeSearchTerm.toLowerCase())
                    )
                    .map((recipe) => (
                      <button
                        key={recipe.id}
                        onClick={() => {
                          setAssembleForm((prev) => ({
                            ...prev,
                            recipe_id: recipe.id,
                            quantity: 1,
                          }));
                          setShowRecipeModal(false);
                          setRecipeSearchTerm("");
                        }}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {recipe.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {recipe.ingredients.length} bahan • Dibuat{" "}
                              {new Date(recipe.created_at).toLocaleDateString(
                                "id-ID"
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Bahan:{" "}
                              {recipe.ingredients
                                .slice(0, 2)
                                .map((ing) => ing.product_name)
                                .join(", ")}
                              {recipe.ingredients.length > 2 &&
                                ` +${recipe.ingredients.length - 2} lainnya`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-600 font-medium">
                              Aktif
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>

                {recipes.filter(
                  (recipe) =>
                    recipe.is_active &&
                    recipe.product_name
                      .toLowerCase()
                      .includes(recipeSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada resep aktif ditemukan</p>
                    <p className="text-sm mt-1">
                      Buat resep baru atau aktifkan resep yang ada
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  onClick={() => {
                    setShowRecipeModal(false);
                    setRecipeSearchTerm("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assembly;
