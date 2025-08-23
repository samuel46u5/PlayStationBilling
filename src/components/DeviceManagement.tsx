import React from "react";
import { db } from "../lib/supabase";
import Swal from "sweetalert2";
import { Edit2, Trash2, Clock, ArrowRight, Save, Divide } from "lucide-react";

// module-scope helper: validate IPv4 and replace occurrences or hostnames in strings
const IPV4_REGEX =
  /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?:\.(?:25[0-5]|2[0-4]\d|1?\d{1,2})){3})\b/;
const replaceIpInStr = (str: any, newIp: string) => {
  if (!str || typeof str !== "string") return str;
  if (!newIp || typeof newIp !== "string") return str;
  if (!IPV4_REGEX.test(newIp)) return str;

  if (IPV4_REGEX.test(str)) {
    const globalIpRegex = new RegExp(IPV4_REGEX.source, "g");
    return String(str).replace(globalIpRegex, newIp);
  }
  try {
    const url = new URL(str);
    if (url.hostname) {
      url.hostname = newIp;
      return url.toString();
    }
  } catch (e) {}
  if (/\blocalhost\b/.test(str)) {
    return String(str).replace(/\blocalhost\b/g, newIp);
  }
  return str;
};

const DevicesMaintenance: React.FC = () => {
  const [devices, setDevices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [time, setTime] = React.useState(() => new Date());
  const [filter, setFilter] = React.useState<
    "all" | "available" | "rented" | "maintenance"
  >("all");
  const [viewMode, setViewMode] = React.useState<"simple" | "detail" | "list">(
    "simple"
  );
  const [showAdd, setShowAdd] = React.useState(false);
  const [editDevice, setEditDevice] = React.useState<any | null>(null);
  const [detailDevice, setDetailDevice] = React.useState<any | null>(null);
  const [selectedCommand, setSelectedCommand] = React.useState("");
  const [volume, setVolume] = React.useState<number>(10);

  React.useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // use existing helper which selects consoles and relations
        const data = await db.consoles.getAll();

        // normalize command field names from DB to component fields
        const normalized = (data || []).map((d: any) => ({
          ...d,
          // some parts of the app use different column names; map them
          cmd_relay_on:
            d.cmd_relay_on ||
            d.relay_command_on ||
            d.relay_command ||
            d.relay_on ||
            null,
          cmd_relay_off:
            d.cmd_relay_off || d.relay_command_off || d.relay_off || null,
          cmd_relay_status:
            d.cmd_relay_status ||
            d.relay_command_status ||
            d.relay_status ||
            null,
          cmd_power_tv:
            d.cmd_power_tv || d.power_tv_command || d.power_command || null,
          cmd_check_power_tv:
            d.cmd_check_power_tv ||
            d.perintah_cek_power_tv ||
            d.check_power_tv ||
            null,
        }));

        setDevices(normalized);
      } catch (err) {
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    console.log(devices);
    console.log(
      "matikan tv",
      devices.map((device) => device.power_tv_command)
    );
    console.log(
      "matikan relay",
      devices.map((device) => device.relay_command_off)
    );
  }, []);

  // clock
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const counts = React.useMemo(
    () => ({
      available: devices.filter((d) => d.status === "available").length,
      rented: devices.filter((d) => d.status === "rented").length,
      maintenance: devices.filter((d) => d.status === "maintenance").length,
      total: devices.length,
    }),
    [devices]
  );

  const displayedDevices = React.useMemo(() => {
    return devices.filter((d) => {
      const matchesFilter = filter === "all" || d.status === filter;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        (d.name || "").toLowerCase().includes(q) ||
        (d.equipment_types?.name || "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [devices, filter, searchTerm]);

  const handleDelete = async (device: any) => {
    const r = await Swal.fire({
      title: `Hapus console ${device.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (r.isConfirmed) {
      try {
        await db.delete("consoles", device.id);
        setDevices((s) => s.filter((d) => d.id !== device.id));
        Swal.fire({ icon: "success", title: "Terhapus" });
      } catch (err) {
        Swal.fire({ icon: "error", title: "Gagal menghapus" });
      }
    }
  };

  const handleSave = async (device: any) => {
    // Map UI/normalized fields to actual DB column names in `consoles` table.
    const payload: any = {};

    // ip_address exists in schema (inet)
    if (device.ip_address !== undefined) payload.ip_address = device.ip_address;

    // Relay commands -> DB columns: relay_command_on/off/status
    const relayOn =
      device.cmd_relay_on ??
      device.relay_command_on ??
      device.relay_command ??
      device.relay_on;
    if (relayOn !== undefined) payload.relay_command_on = relayOn;

    const relayOff =
      device.cmd_relay_off ?? device.relay_command_off ?? device.relay_off;
    if (relayOff !== undefined) payload.relay_command_off = relayOff;

    const relayStatus =
      device.cmd_relay_status ??
      device.relay_command_status ??
      device.relay_status;
    if (relayStatus !== undefined) payload.relay_command_status = relayStatus;

    // TV commands -> DB columns: power_tv_command, perintah_cek_power_tv
    const powerTv =
      device.cmd_power_tv ?? device.power_tv_command ?? device.power_command;
    if (powerTv !== undefined) payload.power_tv_command = powerTv;

    const checkPowerTv =
      device.cmd_check_power_tv ??
      device.perintah_cek_power_tv ??
      device.check_power_tv;
    if (checkPowerTv !== undefined)
      payload.perintah_cek_power_tv = checkPowerTv;

    // TV IP - possible column names: tv_ip, ip_tv, ip_address_tv
    const tvIp = device.ip_address_tv;
    if (tvIp !== undefined) {
      // prefer tv_ip column if exists in DB, otherwise try ip_tv
      payload.ip_address_tv = tvIp;
    }

    if (Object.keys(payload).length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Nothing to save",
        text: "No editable fields found for this console.",
      });
      return;
    }

    const r = await Swal.fire({
      title: `Simpan perubahan untuk ${device.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Simpan",
    });
    if (!r.isConfirmed) return;

    try {
      const updated = await db.update("consoles", device.id, payload);
      setDevices((s) => s.map((x) => (x.id === updated.id ? updated : x)));
      await Swal.fire({ icon: "success", title: "Saved" });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: (err as any)?.message || "Failed to save",
      });
    }
  };

  const runCommand = async () => {
    if (!selectedCommand) {
      await Swal.fire({
        icon: "warning",
        title: "Pilih perintah terlebih dahulu",
      });
      return;
    }
    const r = await Swal.fire({
      title: `Jalankan: ${selectedCommand}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Run",
    });
    if (!r.isConfirmed) return;

    // apply to local state as a visual feedback; do not modify DB unless required
    // setDevices((s) => s.map((d) => ({ ...d, last_command: selectedCommand })));

    switch (selectedCommand) {
      case "Matikan semua TV":
        {
          const results = await Promise.allSettled(
            devices.map(async (device) => {
              // Cek status TV terlebih dahulu
              const statusRes = await fetch(device.perintah_cek_power_tv);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              // Jika TV sudah mati, skip
              if (statusData.status === "off") {
                return { device, status: "already_off" };
              }

              // Jika status "off"
              const res = await fetch(device.power_tv_command);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return { device, status: "success" };
            })
          );

          const successful = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "success"
            )
            .map((r) => r.value.device);

          const alreadyOff = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "already_off"
            )
            .map((r) => r.value.device);

          const failed = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "failed"
            )
            .map((r) => r.value.device)
            .concat(
              results
                .filter(
                  (r): r is PromiseRejectedResult => r.status === "rejected"
                )
                .map((_, i) => devices[i])
            );

          // Menampilkan SweetAlert
          Swal.fire({
            title: "Hasil Proses",
            html: `
              <h4><strong>Berhasil Mati:</strong></h4>
              <ul>
                ${successful
                  .map((device) => `<li>${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Sudah Mati:</strong></h4>
              <ul>
                ${alreadyOff
                  .map((device) => `<li>${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Gagal Mati:</strong></h4>
              <ul>
                ${failed.map((device) => `<li>${device.name}</li>`).join("")}
              </ul>
            `,
            icon: "info",
            confirmButtonText: "Tutup",
            scrollbarPadding: false,
          });
        }
        break;
      case "Nyalakan semua TV":
        {
          const results = await Promise.allSettled(
            devices.map(async (device) => {
              // Cek status TV terlebih dahulu
              const statusRes = await fetch(device.perintah_cek_power_tv);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              // Jika TV sudah menyala, skip
              if (statusData.status === "on") {
                return { device, status: "already_on" };
              }

              // Jika status "off"
              const res = await fetch(device.power_tv_command);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return { device, status: "success" };
            })
          );

          const successful = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "success"
            )
            .map((r) => r.value.device);

          const alreadyOn = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "already_on"
            )
            .map((r) => r.value.device);

          const failed = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "failed"
            )
            .map((r) => r.value.device)
            .concat(
              results
                .filter(
                  (r): r is PromiseRejectedResult => r.status === "rejected"
                )
                .map((_, i) => devices[i])
            );

          // Menampilkan SweetAlert
          Swal.fire({
            title: "Hasil Proses",
            html: `
              <h4><strong>Berhasil Menyala:</strong></h4>
              <ul>
                ${successful
                  .map((device) => `<li>${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Sudah Menyala:</strong></h4>
              <ul>
                ${alreadyOn.map((device) => `<li>${device.name}</li>`).join("")}
              </ul>
              <h4><strong>Gagal Menyala:</strong></h4>
              <ul>
                ${failed.map((device) => `<li>${device.name}</li>`).join("")}
              </ul>
            `,
            icon: "info",
            confirmButtonText: "Tutup",
            scrollbarPadding: false,
          });
        }
        break;
      case "Matikan semua Nomor":
        {
          const results = await Promise.allSettled(
            devices.map(async (device) => {
              // Cek status lampu terlebih dahulu
              const statusRes = await fetch(device.cmd_relay_status);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              if (statusData.status === "off") {
                return { device, status: "already_off" };
              }

              // Jika status "on", lakukan perintah untuk mematikan
              const res = await fetch(device.relay_command_off);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return { device, status: "success" };
            })
          );

          const successful = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "success"
            )
            .map((r) => r.value.device);

          const alreadyOff = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "already_off"
            )
            .map((r) => r.value.device);

          const failed = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "failed"
            )
            .map((r) => r.value.device)
            .concat(
              results
                .filter(
                  (r): r is PromiseRejectedResult => r.status === "rejected"
                )
                .map((_, i) => devices[i])
            );

          await Swal.fire({
            title: "Hasil Proses",
            html: `
              <h4><strong>Berhasil Mati:</strong></h4>
              <ul>
                ${successful
                  .map((device) => `<li>Unit ${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Sudah Mati:</strong></h4>
              <ul>
                ${alreadyOff
                  .map((device) => `<li>Unit ${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Gagal Mati:</strong></h4>
              <ul>
                ${failed
                  .map((device) => `<li>Unit ${device.name}</li>`)
                  .join("")}
              </ul>
            `,
            icon: "info",
            confirmButtonText: "Tutup",
            scrollbarPadding: false,
          });
        }
        break;
      case "Nyalakan semua Nomor":
        {
          const results = await Promise.allSettled(
            devices.map(async (device) => {
              // Cek status lampu terlebih dahulu
              const statusRes = await fetch(device.cmd_relay_status);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              if (statusData.status === "on") {
                return { device, status: "already_on" };
              }

              // Jika status "off", lakukan perintah untuk menyalakan
              const res = await fetch(device.relay_command_on);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return { device, status: "success" };
            })
          );

          const successful = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "success"
            )
            .map((r) => r.value.device);

          const alreadyOn = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "already_on"
            )
            .map((r) => r.value.device);

          const failed = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "failed"
            )
            .map((r) => r.value.device)
            .concat(
              results
                .filter(
                  (r): r is PromiseRejectedResult => r.status === "rejected"
                )
                .map((_, i) => devices[i])
            );

          await Swal.fire({
            title: "Hasil Proses",
            html: `
              <h4><strong>Berhasil Menyala:</strong></h4>
              <ul>
                ${successful
                  .map((device) => `<li>Unit ${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Sudah Menyala:</strong></h4>
              <ul>
                ${alreadyOn
                  .map((device) => `<li>Unit ${device.name}</li>`)
                  .join("")}
              </ul>
              <h4><strong>Gagal Menyala:</strong></h4>
              <ul>
                ${failed
                  .map((device) => `<li>Unit ${device.name}</li>`)
                  .join("")}
              </ul>
            `,
            icon: "info",
            confirmButtonText: "Tutup",
            scrollbarPadding: false,
          });
        }
        break;
      case "Set Volume":
        {
          const results = await Promise.allSettled(
            devices.map((device) =>
              fetch(
                `/tv/${device.ip_address_tv}/volume/${volume}}?port=5555&method=adb`
              )
                .then((res) => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return { device, status: "success" };
                })
                .catch((err) => ({
                  device,
                  status: "failed",
                  error: err.message,
                }))
            )
          );

          const failed = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{ device: any; status: string }> =>
                r.status === "fulfilled" && r.value.status === "failed"
            )
            .map((r) => r.value.device)
            .concat(
              results
                .filter(
                  (r): r is PromiseRejectedResult => r.status === "rejected"
                )
                .map((_, i) => devices[i])
            );

          console.log("URL Gagal:", failed);

          await Promise.allSettled(
            failed.map((url) =>
              fetch(url)
                .then((res) => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return { url, status: "success" };
                })
                .catch((err) => ({ url, status: "failed", error: err.message }))
            )
          );
        }
        break;
      case "Mute Volume": {
        const results = await Promise.allSettled(
          devices.map((device) =>
            fetch(`/tv/${device.ip_address_tv}/volume/0?port=5555&method=adb`)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return { device, status: "success" };
              })
              .catch((err) => ({
                device,
                status: "failed",
                error: err.message,
              }))
          )
        );

        const failed = results
          .filter(
            (r): r is PromiseFulfilledResult<{ device: any; status: string }> =>
              r.status === "fulfilled" && r.value.status === "failed"
          )
          .map((r) => r.value.device)
          .concat(
            results
              .filter(
                (r): r is PromiseRejectedResult => r.status === "rejected"
              )
              .map((_, i) => devices[i])
          );

        console.log("URL Gagal:", failed);

        await Promise.allSettled(
          failed.map((url) =>
            fetch(url)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return { url, status: "success" };
              })
              .catch((err) => ({ url, status: "failed", error: err.message }))
          )
        );
        break;
      }
    }

    // await Swal.fire({
    //   icon: "success",
    //   title: "Perintah dikirim",
    //   text: `Perintah "${selectedCommand}" dikirim ke ${devices.length} console.`,
    // });
  };

  return (
    <div className="p-6">
      {/* Header styled like reference */}
      <div className="mb-6">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold">
                {/* time with dots like 17.00.09 */}
                {(() => {
                  const h = String(time.getHours()).padStart(2, "0");
                  const m = String(time.getMinutes()).padStart(2, "0");
                  const s = String(time.getSeconds()).padStart(2, "0");
                  return `${h}.${m}.${s}`;
                })()}
              </div>
            </div>

            <div className="ml-4">
              <h2 className="text-2xl font-bold">Console Management</h2>
              <p className="text-sm text-gray-600">
                Monitor all consoles and manage rental sessions
              </p>
            </div>

            <div className="ml-6">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama console..."
                className="border border-gray-200 rounded px-3 py-2 w-64 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md text-sm ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter("available")}
                className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200"
              >
                Available ({counts.available})
              </button>
              <button
                onClick={() => setFilter("rented")}
                className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200"
              >
                Active ({counts.rented})
              </button>
              <button
                onClick={() => setFilter("maintenance")}
                className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200"
              >
                Maintenance ({counts.maintenance})
              </button>
            </div>

            <button className="px-3 py-2 rounded-md border border-gray-200 text-sm">
              Lihat History
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("simple")}
                className={`px-3 py-2 rounded-md text-sm ${
                  viewMode === "simple"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setViewMode("detail")}
                className={`px-3 py-2 rounded-md text-sm ${
                  viewMode === "detail"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                Detail
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-md text-sm ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Command control bar */}
      <div className="mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-40 text-sm font-medium">Perintah</div>
          <select
            value={selectedCommand}
            onChange={(e) => setSelectedCommand(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
          >
            <option value="">-- Pilih Perintah --</option>
            <option value="Matikan semua TV">Matikan semua TV</option>
            <option value="Nyalakan semua TV">Nyalakan semua TV</option>
            <option value="Matikan semua Nomor">Matikan semua Nomor</option>
            <option value="Nyalakan semua Nomor">Nyalakan semua Nomor</option>
            <option value="Set Volume">Set volume semua TV</option>
            <option value="Mute Volume">Set mute semua TV</option>
          </select>
          {selectedCommand === "Set Volume" && (
            <>
              <div className="text-sm font-semibold text-slate-700">Volume</div>
              <div className="relative mt-1">
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Masukkan volume"
                />
              </div>
            </>
          )}

          <button
            onClick={runCommand}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Run
          </button>
        </div>
      </div>

      {/* Card grid for simple view */}
      {viewMode === "simple" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading...
            </div>
          ) : displayedDevices.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No devices found
            </div>
          ) : (
            displayedDevices.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Purple header */}
                <div className="bg-purple-500 flex items-center px-4 py-2">
                  <span className="mr-2 text-white text-lg">
                    <Clock className="inline-block h-5 w-5" />
                  </span>
                  <span className="text-white font-semibold text-sm flex-1">
                    {d.name}
                  </span>
                </div>
                {/* Commands panel (green) - inputs with arrow buttons like the Consoles form */}
                <div className="px-4 pt-3 pb-2">
                  <div className="bg-green-50 px-3 py-3 rounded-lg mx-3 mb-2 text-sm text-slate-800">
                    <div className="space-y-2">
                      {/* Separator label RELAY - IP Address is part of Relay */}
                      <div className="my-3 flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <div className="text-sm font-semibold text-slate-700">
                          RELAY
                        </div>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-700">
                            IP Address Relay
                          </div>
                          <input
                            value={d.ip_address || ""}
                            onChange={(e) => {
                              const newIp = e.target.value;
                              // IPv4 regex
                              // use shared helper
                              const replaceIpIfPresent = (
                                str: any,
                                newIp: string
                              ) => replaceIpInStr(str, newIp);
                              setDevices((s) =>
                                s.map((x) => {
                                  if (x.id !== d.id) return x;
                                  return {
                                    ...x,
                                    ip_address: newIp,
                                    cmd_relay_on: replaceIpIfPresent(
                                      x.cmd_relay_on ??
                                        x.relay_command_on ??
                                        x.relay_command ??
                                        x.relay_on,
                                      newIp
                                    ),
                                    cmd_relay_off: replaceIpIfPresent(
                                      x.cmd_relay_off ??
                                        x.relay_command_off ??
                                        x.relay_off,
                                      newIp
                                    ),
                                    cmd_relay_status: replaceIpIfPresent(
                                      x.cmd_relay_status ??
                                        x.relay_command_status ??
                                        x.relay_status,
                                      newIp
                                    ),
                                  };
                                })
                              );
                            }}
                            className="w-full px-3 py-2 border rounded bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="">
                        <div className="text-sm font-semibold text-slate-700">
                          Perintah Relay ON
                        </div>
                        <div className="relative mt-1">
                          <input
                            value={d.cmd_relay_on ?? d.relay_command_on ?? ""}
                            onChange={(e) =>
                              setDevices((s) =>
                                s.map((x) =>
                                  x.id === d.id
                                    ? { ...x, cmd_relay_on: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full px-3 py-2 border rounded bg-white text-sm pr-10"
                          />
                          <button
                            onClick={() =>
                              Swal.fire({
                                title: "Perintah Relay ON",
                                html: `<pre style='text-align:left'>${
                                  d.cmd_relay_on || d.relay_command_on || "-"
                                }</pre>`,
                              })
                            }
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-md"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="">
                        <div className="text-sm font-semibold text-slate-700">
                          Perintah Relay OFF
                        </div>
                        <div className="relative mt-1">
                          <input
                            value={d.cmd_relay_off ?? d.relay_command_off ?? ""}
                            onChange={(e) =>
                              setDevices((s) =>
                                s.map((x) =>
                                  x.id === d.id
                                    ? { ...x, cmd_relay_off: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full px-3 py-2 border rounded bg-white text-sm pr-10"
                          />
                          <button
                            onClick={() =>
                              Swal.fire({
                                title: "Perintah Relay OFF",
                                html: `<pre style='text-align:left'>${
                                  d.cmd_relay_off || d.relay_command_off || "-"
                                }</pre>`,
                              })
                            }
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-md"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="">
                        <div className="text-sm font-semibold text-slate-700">
                          Perintah Relay STATUS
                        </div>
                        <div className="relative mt-1">
                          <input
                            value={
                              d.cmd_relay_status ?? d.relay_command_status ?? ""
                            }
                            onChange={(e) =>
                              setDevices((s) =>
                                s.map((x) =>
                                  x.id === d.id
                                    ? { ...x, cmd_relay_status: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full px-3 py-2 border rounded bg-white text-sm pr-10"
                          />
                          <button
                            onClick={() =>
                              Swal.fire({
                                title: "Perintah Relay STATUS",
                                html: `<pre style='text-align:left'>${
                                  d.cmd_relay_status ||
                                  d.relay_command_status ||
                                  "-"
                                }</pre>`,
                              })
                            }
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-md"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Separator between Relay and TV commands */}
                      <div className="my-3 flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <div className="text-sm font-semibold text-slate-700">
                          TV
                        </div>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>

                      <div className="mt-2">
                        <div className="text-sm font-semibold text-slate-700">
                          IP Address TV
                        </div>
                        <input
                          value={d.ip_address_tv ?? ""}
                          onChange={(e) => {
                            const newIp = e.target.value;
                            setDevices((s) =>
                              s.map((x) => {
                                if (x.id !== d.id) return x;
                                return {
                                  ...x,
                                  ip_address_tv: newIp,
                                  cmd_power_tv: replaceIpInStr(
                                    x.cmd_power_tv ?? x.power_tv_command ?? "",
                                    newIp
                                  ),
                                  cmd_check_power_tv: replaceIpInStr(
                                    x.cmd_check_power_tv ??
                                      x.perintah_cek_power_tv ??
                                      "",
                                    newIp
                                  ),
                                };
                              })
                            );
                          }}
                          className="w-full px-3 py-2 border rounded bg-white text-sm mt-1"
                        />
                      </div>

                      <div className="">
                        <div className="text-sm font-semibold text-slate-700">
                          Perintah Power TV
                        </div>
                        <div className="relative mt-1">
                          <input
                            value={d.cmd_power_tv ?? d.power_tv_command ?? ""}
                            onChange={(e) =>
                              setDevices((s) =>
                                s.map((x) =>
                                  x.id === d.id
                                    ? { ...x, cmd_power_tv: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full px-3 py-2 border rounded bg-white text-sm pr-10"
                          />
                          <button
                            onClick={() =>
                              Swal.fire({
                                title: "Perintah Power TV",
                                html: `<pre style='text-align:left'>${
                                  d.cmd_power_tv || d.power_tv_command || "-"
                                }</pre>`,
                              })
                            }
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-md"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="">
                        <div className="text-sm font-semibold text-slate-700">
                          Perintah Cek Power TV
                        </div>
                        <div className="relative mt-1">
                          <input
                            value={
                              d.cmd_check_power_tv ??
                              d.perintah_cek_power_tv ??
                              ""
                            }
                            onChange={(e) =>
                              setDevices((s) =>
                                s.map((x) =>
                                  x.id === d.id
                                    ? {
                                        ...x,
                                        cmd_check_power_tv: e.target.value,
                                      }
                                    : x
                                )
                              )
                            }
                            className="w-full px-3 py-2 border rounded bg-white text-sm pr-10"
                          />
                          <button
                            onClick={() =>
                              Swal.fire({
                                title: "Perintah Cek Power TV",
                                html: `<pre style='text-align:left'>${
                                  d.cmd_check_power_tv ||
                                  d.perintah_cek_power_tv ||
                                  "-"
                                }</pre>`,
                              })
                            }
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-md"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center justify-between px-4 pb-4 gap-2">
                  <button
                    onClick={() => setEditDevice(d)}
                    className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 mx-1"
                  >
                    Stop
                  </button>
                  <button
                    onClick={() => setDetailDevice(d)}
                    className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 mx-1"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => handleSave(d)}
                    className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 mx-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : viewMode === "detail" ? (
        // Detail mode: expanded card view per console (matches provided example)
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading...
            </div>
          ) : displayedDevices.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No devices found
            </div>
          ) : (
            displayedDevices.map((d) => {
              const displayTotal = d.total || d.total_price || d.price || 0;
              const displayStart =
                d.start_time ||
                d.started_at ||
                d.start ||
                d.startTime ||
                "09.29";
              const displayDuration = d.duration || "08:10:45";
              return (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* header */}
                  <div className="bg-purple-500 text-white px-5 py-4 rounded-t-lg flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-white">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M6 6h12v4H6z" />
                        </svg>
                      </div>
                      <div className="font-semibold">{d.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Total</div>
                      <div className="text-lg font-bold">Rp {displayTotal}</div>
                    </div>
                  </div>

                  {/* status badge */}
                  <div className="px-5 pt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        d.status === "active"
                          ? "bg-blue-600 text-white"
                          : d.status === "ready"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {(d.status || "PENDING").toUpperCase()}
                    </span>
                  </div>

                  {/* info panel */}
                  <div className="bg-green-50 p-4 m-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-800">
                      <div>
                        <div className="text-xs text-slate-600">Mulai:</div>
                        <div className="font-semibold">{displayStart}</div>
                        <div className="text-xs text-slate-600 mt-2">
                          Biaya:
                        </div>
                        <div className="font-semibold">Rp {displayTotal}</div>
                        <div className="text-xs text-slate-600 mt-2">
                          Status:
                        </div>
                        <div className="font-semibold">
                          {(d.status || "PENDING").toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">Durasi:</div>
                        <div className="text-sm text-green-800 font-semibold">
                          Durasi : {displayDuration}
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                          Total Produk:
                        </div>
                        <div>Rp {d.products_total || 0}</div>
                        <div className="text-xs text-slate-600 mt-2">
                          Tarif per Jam:
                        </div>
                        <div>Rp {d.price || 15000}</div>
                      </div>
                    </div>
                    <hr className="my-3" />
                    <div className="text-center text-blue-800 font-semibold">
                      Durasi : {displayDuration}
                    </div>
                  </div>

                  {/* action buttons */}
                  <div className="px-5 pb-5">
                    <button
                      onClick={async () => {
                        const r = await Swal.fire({
                          title: `End rental ${d.name}?`,
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonText: "End Rental",
                        });
                        if (r.isConfirmed) {
                          try {
                            await db.update("consoles", d.id, {
                              status: "available",
                              user: null,
                            });
                            setDevices((s) =>
                              s.map((x) =>
                                x.id === d.id
                                  ? { ...x, status: "available", user: null }
                                  : x
                              )
                            );
                            Swal.fire({
                              icon: "success",
                              title: "Rental ended",
                            });
                          } catch (err) {
                            Swal.fire({
                              icon: "error",
                              title: "Failed to end rental",
                            });
                          }
                        }
                      }}
                      className="w-full mb-3 bg-red-600 text-white py-3 rounded-lg"
                    >
                      <span className="inline-block mr-2">☑</span> End Rental
                    </button>

                    <button
                      onClick={() =>
                        Swal.fire(
                          "Add products",
                          "Open product selector (not implemented)",
                          "info"
                        )
                      }
                      className="w-full bg-orange-500 text-white py-3 rounded-lg"
                    >
                      <span className="inline-block mr-2">🛒</span> Add Products
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // ...existing code for table/grid views...
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : displayedDevices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No devices found
                    </td>
                  </tr>
                ) : (
                  displayedDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{d.name}</td>
                      <td className="px-6 py-4">
                        {d.equipment_types?.name || d.type || "-"}
                      </td>
                      <td className="px-6 py-4">{d.status || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setEditDevice(d)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded inline-flex items-center gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(d)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded inline-flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <ConsoleModal
          onClose={() => setShowAdd(false)}
          onSaved={(created) => {
            setShowAdd(false);
            setDevices((s) => [created, ...s]);
          }}
        />
      )}

      {editDevice && (
        <ConsoleModal
          device={editDevice}
          onClose={() => setEditDevice(null)}
          onSaved={(updated) => {
            setEditDevice(null);
            setDevices((s) =>
              s.map((x) => (x.id === updated.id ? updated : x))
            );
          }}
        />
      )}

      {detailDevice && (
        <ConsoleDetailModal
          device={detailDevice}
          onClose={() => setDetailDevice(null)}
          onSaved={(updated) => {
            setDetailDevice(null);
            setDevices((s) =>
              s.map((x) => (x.id === updated.id ? updated : x))
            );
          }}
        />
      )}
    </div>
  );
};

export default DevicesMaintenance;

interface ConsoleModalProps {
  device?: any;
  onClose: () => void;
  onSaved: (item: any) => void;
}

const ConsoleModal: React.FC<ConsoleModalProps> = ({
  device,
  onClose,
  onSaved,
}) => {
  const [name, setName] = React.useState(device?.name || "");
  const [type, setType] = React.useState(
    device?.equipment_types?.name || device?.type || ""
  );
  const [status, setStatus] = React.useState(device?.status || "available");
  const [loading, setLoading] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (device) {
        const updated = await db.update("consoles", device.id, {
          name,
          status,
        });
        onSaved(updated);
      } else {
        const created = await db.insert("consoles", {
          id: uuidv4(),
          name,
          status,
        });
        onSaved(created);
      }
      Swal.fire({ icon: "success", title: "Saved" });
    } catch (err) {
      const msg = (err && (err as any).message) || "Failed";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {device ? "Edit Console" : "Tambah Console"}
          </h2>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_order">Out of Order</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function uuidv4() {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const ConsoleDetailModal: React.FC<{
  device: any;
  onClose: () => void;
  onSaved: (d: any) => void;
}> = ({ device, onClose, onSaved }) => {
  const [ip, setIp] = React.useState(device?.ip_address || "");
  const [relayOn, setRelayOn] = React.useState(device?.cmd_relay_on || "");
  const [relayOff, setRelayOff] = React.useState(device?.cmd_relay_off || "");
  const [relayStatus, setRelayStatus] = React.useState(
    device?.cmd_relay_status || ""
  );
  const [powerTv, setPowerTv] = React.useState(device?.cmd_power_tv || "");
  const [checkPowerTv, setCheckPowerTv] = React.useState(
    device?.cmd_check_power_tv || ""
  );
  const [loading, setLoading] = React.useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await db.update("consoles", device.id, {
        ip_address: ip,
        cmd_relay_on: relayOn,
        cmd_relay_off: relayOff,
        cmd_relay_status: relayStatus,
        cmd_power_tv: powerTv,
        cmd_check_power_tv: checkPowerTv,
      });
      onSaved(updated);
      Swal.fire({ icon: "success", title: "Saved" });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (err as any)?.message || "Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Edit Konsol
          </h2>
          <div className="flex gap-2 mb-4">
            <button className="px-3 py-2 rounded-md bg-white border">
              Informasi Umum
            </button>
            <button className="px-3 py-2 rounded-md bg-white border">
              Detail Teknis
            </button>
            <button className="px-3 py-2 rounded-md bg-blue-600 text-white">
              Daftar Perintah
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                IP Address
              </label>
              <input
                value={ip}
                onChange={(e) => {
                  const newIp = e.target.value;
                  // IPv4 regex
                  const replaceIpIfPresent = (str: any) =>
                    replaceIpInStr(str, newIp);
                  setIp(newIp);
                  setRelayOn((prev: string) => replaceIpIfPresent(prev));
                  setRelayOff((prev: string) => replaceIpIfPresent(prev));
                  setRelayStatus((prev: string) => replaceIpIfPresent(prev));
                }}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Perintah Relay ON
                </label>
                <input
                  value={relayOn}
                  onChange={(e) => setRelayOn(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button className="px-3 py-2 bg-white border rounded">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Perintah Relay OFF
                </label>
                <input
                  value={relayOff}
                  onChange={(e) => setRelayOff(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button className="px-3 py-2 bg-white border rounded">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Perintah Relay STATUS
                </label>
                <input
                  value={relayStatus}
                  onChange={(e) => setRelayStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button className="px-3 py-2 bg-white border rounded">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Perintah Power TV
                </label>
                <input
                  value={powerTv}
                  onChange={(e) => setPowerTv(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button className="px-3 py-2 bg-white border rounded">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Perintah Cek Power TV
                </label>
                <input
                  value={checkPowerTv}
                  onChange={(e) => setCheckPowerTv(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button className="px-3 py-2 bg-white border rounded">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Saving..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
