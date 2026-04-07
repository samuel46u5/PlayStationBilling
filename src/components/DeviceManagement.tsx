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
  const [selectedDevices, setSelectedDevices] = React.useState<string[]>([]);
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

  const runCommandCheckModal = async () => {
    const targetDevices =
      selectedDevices.length > 0
        ? devices.filter((d) => selectedDevices.includes(d.id))
        : displayedDevices;

    if (targetDevices.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Tidak ada unit untuk dicek",
        text: "Pilih unit terlebih dahulu atau ubah filter pencarian.",
      });
      return;
    }

    const validateCommandUrl = (value: string | null | undefined) => {
      if (!value || typeof value !== "string") {
        return "Error";
      }

      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return "Error";
      }

      // Reject malformed authorities like `http:///host/path` before URL normalization.
      const strictHttpUrlPattern = /^https?:\/\/[^\s/?#]+(?:[/?#]|$)/i;
      if (!strictHttpUrlPattern.test(trimmedValue)) {
        return "Error";
      }

      try {
        const parsed = new URL(trimmedValue);
        const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";

        if (!isHttp || !parsed.hostname) {
          return "Error";
        }

        if (/^https?:\/\/\//i.test(trimmedValue)) {
          return "Error";
        }

        return "OK";
      } catch (_err) {
        return "Error";
      }
    };

    const escapeHtml = (value: string | null | undefined) => {
      const str = String(value || "-");
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const rows = [...targetDevices]
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "id", {
          sensitivity: "base",
        })
      )
      .map((device) => {
        const relayOnCommand =
          device.cmd_relay_on ||
          device.relay_command_on ||
          device.relay_command ||
          device.relay_on ||
          "";
        const relayOffCommand =
          device.cmd_relay_off || device.relay_command_off || device.relay_off || "";
        const relayStatusCommand =
          device.cmd_relay_status ||
          device.relay_command_status ||
          device.relay_status ||
          "";
        const powerTvCommand =
          device.cmd_power_tv || device.power_tv_command || device.power_command || "";
        const checkPowerTvCommand =
          device.cmd_check_power_tv ||
          device.perintah_cek_power_tv ||
          device.check_power_tv ||
          "";

        return {
          unit: device.name || "-",
          commands: [
            {
              key: "relay-on",
              label: "Perintah Relay ON",
              command: relayOnCommand,
              status: validateCommandUrl(relayOnCommand),
            },
            {
              key: "relay-off",
              label: "Perintah Relay OFF",
              command: relayOffCommand,
              status: validateCommandUrl(relayOffCommand),
            },
            {
              key: "relay-status",
              label: "Perintah Relay STATUS",
              command: relayStatusCommand,
              status: validateCommandUrl(relayStatusCommand),
            },
            {
              key: "power-tv",
              label: "Perintah Power TV",
              command: powerTvCommand,
              status: validateCommandUrl(powerTvCommand),
            },
            {
              key: "check-power-tv",
              label: "Perintah Cek Power TV",
              command: checkPowerTvCommand,
              status: validateCommandUrl(checkPowerTvCommand),
            },
          ],
        };
      });

    const totalCommands = rows.reduce((sum, row) => sum + row.commands.length, 0);
    const totalOk = rows.reduce(
      (sum, row) =>
        sum + row.commands.filter((item) => item.status === "OK").length,
      0
    );
    const totalError = totalCommands - totalOk;
    const totalUnitsWithError = rows.filter((row) =>
      row.commands.some((item) => item.status === "Error")
    ).length;

    const renderStatus = (status: string) => {
      const bg = status === "OK" ? "#dcfce7" : "#fee2e2";
      const color = status === "OK" ? "#166534" : "#991b1b";
      return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${bg};color:${color};font-weight:700;font-size:12px;">${status}</span>`;
    };

    const contentHtml = rows
      .map((row) => {
        const errorCount = row.commands.filter(
          (item) => item.status === "Error"
        ).length;

        const commandRows = row.commands
          .map(
            (item, commandIndex) => {
              const rowId = `${escapeHtml(row.unit)}-${item.key}-${commandIndex}`
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-");

              return `
              <tr class="hover:bg-gray-50 command-row" data-command-status="${item.status}" data-command-row="${rowId}">
                <td class="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">${item.label}</td>
                <td class="px-4 py-3 text-sm text-gray-600" style="word-break:break-all;">${escapeHtml(item.command)}</td>
                <td class="px-4 py-3 text-center">${renderStatus(item.status)}</td>
                <td class="px-4 py-3 text-center">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    data-run-command="${rowId}"
                    data-command-url="${escapeHtml(item.command)}"
                    data-command-status="${item.status}"
                  >
                    Run
                  </button>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500" id="command-run-result-${rowId}">-</td>
              </tr>
            `;
            }
          )
          .join("");

        return `
          <div class="border-b border-gray-200 last:border-b-0 command-section" data-section-error-count="${errorCount}">
            <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
              <div>
                <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold">Unit</div>
                <div class="text-base font-semibold text-gray-900">${escapeHtml(row.unit)}</div>
              </div>
              <div class="text-sm text-gray-500">${row.commands.length} perintah diperiksa${errorCount > 0 ? ` • ${errorCount} error` : ""}</div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-white">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis Perintah</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hasil Run</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                  ${commandRows}
                </tbody>
              </table>
            </div>
          </div>
        `;
      })
      .join("");

    await Swal.fire({
      title: `Check Perintah (${rows.length} Unit)`,
      width: 1000,
      html: `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Validasi Perintah URL</h3>
                <p class="text-sm text-gray-600 mt-1">Pengecekan ini memvalidasi format URL perintah dari data console dan dapat menjalankan perintah satu per satu.</p>
              </div>
              <button
                type="button"
                id="toggle-command-error-filter"
                class="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                Hanya tampilkan error
              </button>
            </div>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wider text-green-700">Total OK</div>
                <div class="mt-1 text-2xl font-bold text-green-800">${totalOk}</div>
              </div>
              <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wider text-red-700">Total Error</div>
                <div class="mt-1 text-2xl font-bold text-red-800">${totalError}</div>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-600">Unit Dengan Error</div>
                <div class="mt-1 text-2xl font-bold text-slate-800">${totalUnitsWithError}</div>
              </div>
            </div>
          </div>
          <div style="max-height:60vh;overflow:auto;">
            ${contentHtml}
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Tutup",
      scrollbarPadding: false,
      didOpen: () => {
        const popup = Swal.getPopup();
        if (!popup) return;

        const toggleBtn = popup.querySelector<HTMLButtonElement>(
          "#toggle-command-error-filter"
        );
        const sections = popup.querySelectorAll<HTMLElement>(".command-section");
        let errorsOnly = false;

        const updateFilterState = () => {
          sections.forEach((section) => {
            const rowsInSection = section.querySelectorAll<HTMLElement>(
              ".command-row"
            );
            let visibleCount = 0;

            rowsInSection.forEach((rowEl) => {
              const isError = rowEl.getAttribute("data-command-status") === "Error";
              const shouldShow = !errorsOnly || isError;
              rowEl.style.display = shouldShow ? "" : "none";
              if (shouldShow) visibleCount += 1;
            });

            section.style.display = visibleCount > 0 ? "" : "none";
          });

          if (toggleBtn) {
            toggleBtn.textContent = errorsOnly
              ? "Tampilkan semua"
              : "Hanya tampilkan error";
          }
        };

        const fetchRunResult = async (url: string) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(url, { signal: controller.signal });
            const rawText = await response.text();

            let formatted = rawText;
            try {
              const parsed = rawText ? JSON.parse(rawText) : null;
              formatted = parsed ? JSON.stringify(parsed) : rawText || "(empty)";
            } catch (_err) {
              formatted = rawText || "(empty)";
            }

            return {
              ok: response.ok,
              text: formatted,
              statusCode: response.status,
            };
          } catch (err: any) {
            if (err?.name === "AbortError") {
              return {
                ok: false,
                text: "Timeout setelah 10 detik",
                statusCode: 408,
              };
            }

            return {
              ok: false,
              text: err?.message || "Request gagal",
              statusCode: 500,
            };
          } finally {
            clearTimeout(timeoutId);
          }
        };

        if (toggleBtn) {
          toggleBtn.onclick = () => {
            errorsOnly = !errorsOnly;
            updateFilterState();
          };
        }

        const runButtons = popup.querySelectorAll<HTMLButtonElement>(
          "button[data-run-command]"
        );

        runButtons.forEach((button) => {
          button.onclick = async () => {
            const rowId = button.getAttribute("data-run-command");
            const commandUrl = button.getAttribute("data-command-url") || "";
            const commandStatus = button.getAttribute("data-command-status");

            if (!rowId) return;

            const resultEl = popup.querySelector<HTMLElement>(
              `#command-run-result-${rowId}`
            );

            if (!resultEl) return;

            if (commandStatus !== "OK") {
              resultEl.innerHTML = '<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#fee2e2;color:#991b1b;font-weight:700;font-size:12px;">URL tidak valid</span>';
              return;
            }

            button.disabled = true;
            button.textContent = "Running...";
            resultEl.innerHTML = '<span style="color:#2563eb;font-weight:600;">Menjalankan...</span>';

            const runResult = await fetchRunResult(commandUrl);
            const badge = runResult.ok
              ? '<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:700;font-size:12px;">Success</span>'
              : '<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#fee2e2;color:#991b1b;font-weight:700;font-size:12px;">Error</span>';
            const resultText = escapeHtml(runResult.text).slice(0, 300);

            resultEl.innerHTML = `
              <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start;">
                <div>${badge} <span style="font-size:12px;color:#6b7280;">HTTP ${runResult.statusCode}</span></div>
                <div style="font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:12px;color:#374151;white-space:pre-wrap;word-break:break-word;">${resultText || "(empty)"}</div>
              </div>
            `;

            button.disabled = false;
            button.textContent = "Run";
          };
        });

        updateFilterState();
      },
    });
  };

  const runIpCheckModal = async () => {
    const targetDevices =
      selectedDevices.length > 0
        ? devices.filter((d) => selectedDevices.includes(d.id))
        : displayedDevices;

    if (targetDevices.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Tidak ada unit untuk dicek",
        text: "Pilih unit terlebih dahulu atau ubah filter pencarian.",
      });
      return;
    }

    const rows = [...targetDevices]
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "id", {
          sensitivity: "base",
        })
      )
      .map((device) => ({
        unit: device.name || "-",
        ipTv: device.ip_address_tv || "-",
        ipRelay: device.ip_address || "-",
        tvCmd: device.cmd_check_power_tv || device.perintah_cek_power_tv || null,
        relayCmd: device.cmd_relay_status || device.relay_command_status || null,
      }));

    const checkSingleRow = async (row: {
      tvCmd: string | null;
      relayCmd: string | null;
    }) => {
      const fetchWithTimeout = async (url: string, timeoutMs: number) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, { signal: controller.signal });
          return { response, timedOut: false };
        } catch (err: any) {
          if (err?.name === "AbortError") {
            return { response: null, timedOut: true };
          }
          throw err;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      let tvStatus = "Error";
      let relayStatus = "Error";
      let tvReachable = false;
      let relayReachable = false;

      if (!row.tvCmd) {
        tvStatus = "No Command";
      } else {
        try {
          const tvReq = await fetchWithTimeout(row.tvCmd, 10000);
          if (tvReq.timedOut) {
            tvStatus = "Timeout";
          } else if (tvReq.response?.ok) {
            tvReachable = true;
            let tvData: any = null;
            try {
              tvData = await tvReq.response.json();
            } catch (_err) {
              tvData = null;
            }

            if (tvData?.status === "on") {
              tvStatus = "ON";
            } else if (tvData?.status === "off") {
              tvStatus = "OFF";
            } else {
              tvStatus = "Passed";
            }
          } else {
            tvStatus = "Error";
          }
        } catch (_err) {
          tvStatus = "Error";
        }
      }

      if (!row.relayCmd) {
        relayStatus = "No Command";
      } else {
        try {
          const relayReq = await fetchWithTimeout(row.relayCmd, 10000);
          if (relayReq.timedOut) {
            relayStatus = "Timeout";
          } else if (relayReq.response?.ok) {
            relayReachable = true;
            let relayData: any = null;
            try {
              relayData = await relayReq.response.json();
            } catch (_err) {
              relayData = null;
            }

            if (relayData?.POWER === "ON") {
              relayStatus = "ON";
            } else if (relayData?.POWER === "OFF") {
              relayStatus = "OFF";
            } else if (relayData?.status === "on") {
              relayStatus = "ON";
            } else if (relayData?.status === "off") {
              relayStatus = "OFF";
            } else {
              relayStatus = "Passed";
            }
          } else {
            relayStatus = "Error";
          }
        } catch (_err) {
          relayStatus = "Error";
        }
      }

      const passedCount = [tvReachable, relayReachable].filter(Boolean).length;
      const result =
        passedCount === 2
          ? "Passed"
          : passedCount === 1
          ? "Partial"
          : "Error";

      return { tvStatus, relayStatus, result };
    };

    const rowHtml = rows
      .map(
        (r, idx) => `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${r.unit}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${r.ipTv}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span id="ip-check-tv-${idx}" style="display:inline-block;padding:2px 8px;border-radius:999px;background:#f3f4f6;color:#334155;font-weight:600;">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${r.ipRelay}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span id="ip-check-relay-${idx}" style="display:inline-block;padding:2px 8px;border-radius:999px;background:#f3f4f6;color:#334155;font-weight:600;">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
              <div>
                <span id="ip-check-result-${idx}" style="display:inline-block;padding:2px 8px;border-radius:999px;background:#f3f4f6;color:#334155;font-weight:700;">Belum dicek</span>
              </div>
              <button
                type="button"
                data-ip-check-row="${idx}"
                class="mt-2 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-50"
              >
                Cek
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    await Swal.fire({
      title: `Hasil IP Check (${rows.length} Unit)`,
      width: 1100,
      html: `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left">
          <div class="p-6 border-b border-gray-200 flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">IP Check Console</h3>
              <p class="text-sm text-gray-600 mt-1">Daftar unit yang siap dicek untuk TV dan relay.</p>
            </div>
            <button
              type="button"
              id="ip-check-all-button"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Check All
            </button>
          </div>
          <div class="overflow-x-auto" style="max-height:60vh;">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ip Tv</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Tv</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ip Relay</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Relay</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
              ${rowHtml}
              </tbody>
            </table>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Tutup",
      scrollbarPadding: false,
      didOpen: () => {
        const popup = Swal.getPopup();
        if (!popup) return;

        const applyBadgeStyle = (el: HTMLElement, value: string) => {
          let bg = "#f3f4f6";
          let color = "#334155";

          if (value === "Passed" || value === "ON") {
            bg = "#dcfce7";
            color = "#166534";
          } else if (value === "Partial") {
            bg = "#fef3c7";
            color = "#92400e";
          } else if (value === "Error") {
            bg = "#fee2e2";
            color = "#991b1b";
          } else if (value === "OFF") {
            bg = "#e0f2fe";
            color = "#075985";
          } else if (value === "No Command") {
            bg = "#ede9fe";
            color = "#5b21b6";
          } else if (value === "Timeout") {
            bg = "#ffedd5";
            color = "#9a3412";
          } else if (value === "Checking...") {
            bg = "#dbeafe";
            color = "#1d4ed8";
          }

          el.style.background = bg;
          el.style.color = color;
        };

        const buttons = popup.querySelectorAll<HTMLButtonElement>(
          "button[data-ip-check-row]"
        );

        const runSingleCheck = async (idx: number, btn?: HTMLButtonElement) => {
          const row = rows[idx];
          if (!row) return;

          const tvEl = popup.querySelector<HTMLElement>(`#ip-check-tv-${idx}`);
          const relayEl = popup.querySelector<HTMLElement>(`#ip-check-relay-${idx}`);
          const resultEl = popup.querySelector<HTMLElement>(`#ip-check-result-${idx}`);

          if (!tvEl || !relayEl || !resultEl) return;

          tvEl.textContent = "Checking...";
          relayEl.textContent = "Checking...";
          resultEl.textContent = "Checking...";
          applyBadgeStyle(tvEl, "Checking...");
          applyBadgeStyle(relayEl, "Checking...");
          applyBadgeStyle(resultEl, "Checking...");
          if (btn) btn.disabled = true;

          const checkResult = await checkSingleRow(row);

          tvEl.textContent = checkResult.tvStatus;
          relayEl.textContent = checkResult.relayStatus;
          resultEl.textContent = checkResult.result;
          applyBadgeStyle(tvEl, checkResult.tvStatus);
          applyBadgeStyle(relayEl, checkResult.relayStatus);
          applyBadgeStyle(resultEl, checkResult.result);
          if (btn) btn.disabled = false;
        };

        const checkAllBtn = popup.querySelector<HTMLButtonElement>(
          "#ip-check-all-button"
        );

        if (checkAllBtn) {
          checkAllBtn.onclick = async () => {
            checkAllBtn.disabled = true;
            checkAllBtn.textContent = "Checking All...";
            buttons.forEach((b) => {
              b.disabled = true;
            });

            await Promise.all(
              Array.from(buttons).map((b) => {
                const idx = Number(b.getAttribute("data-ip-check-row"));
                return runSingleCheck(idx);
              })
            );

            buttons.forEach((b) => {
              b.disabled = false;
            });
            checkAllBtn.textContent = "Check All";
            checkAllBtn.disabled = false;
          };
        }

        buttons.forEach((btn) => {
          btn.onclick = async () => {
            const idx = Number(btn.getAttribute("data-ip-check-row"));
            await runSingleCheck(idx, btn);
          };
        });
      },
    });
  };

  const runCommand = async () => {
    if (selectedDevices.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Pilih console terlebih dahulu",
        text: "Gunakan checkbox pada console yang ingin Anda pilih.",
      });
      return;
    }
    if (!selectedCommand) {
      await Swal.fire({
        icon: "warning",
        title: "Pilih perintah terlebih dahulu",
      });
      return;
    }
    const r = await Swal.fire({
      title: `Jalankan: ${selectedCommand}?`,
      text: `Akan dijalankan pada ${selectedDevices.length} console yang dipilih.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Run",
    });
    if (!r.isConfirmed) return;

    const targetDevices = devices.filter((d) => selectedDevices.includes(d.id));

    // apply to local state as a visual feedback; do not modify DB unless required
    // setDevices((s) => s.map((d) => ({ ...d, last_command: selectedCommand })));

    switch (selectedCommand) {
      case "Matikan semua TV":
        {
          const results = await Promise.allSettled(
            targetDevices.map(async (device) => {
              // Cek status TV terlebih dahulu
              const statusRes = await fetch(device.cmd_check_power_tv || device.perintah_cek_power_tv);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              // Jika TV sudah mati, skip
              if (statusData.status === "off") {
                return { device, status: "already_off" };
              }

              // Jika status "off"
              const res = await fetch(device.cmd_power_tv || device.power_tv_command);
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
                .map((_, i) => targetDevices[i])
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
            targetDevices.map(async (device) => {
              // Cek status TV terlebih dahulu
              const statusRes = await fetch(device.cmd_check_power_tv || device.perintah_cek_power_tv);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              // Jika TV sudah menyala, skip
              if (statusData.status === "on") {
                return { device, status: "already_on" };
              }

              // Jika status "off"
              const res = await fetch(device.cmd_power_tv || device.power_tv_command);
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
                .map((_, i) => targetDevices[i])
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
            targetDevices.map(async (device) => {
              // Cek status lampu terlebih dahulu
              const statusRes = await fetch(device.cmd_relay_status);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              if (statusData.POWER === "OFF") {
                return { device, status: "already_off" };
              }

              // Jika status "on", lakukan perintah untuk mematikan
              const res = await fetch(device.cmd_relay_off || device.relay_command_off);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              
              const resData = await res.json();
              
              if (resData.POWER === "OFF") {
                return { device, status: "success" };
              } else {
                return { device, status: "failed", reason: resData };
              }
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
                .map((_, i) => targetDevices[i])
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
            targetDevices.map(async (device) => {
              // Cek status lampu terlebih dahulu
              const statusRes = await fetch(device.cmd_relay_status);

              if (!statusRes.ok) {
                throw new Error(`HTTP ${statusRes.status}`);
              }

              const statusData = await statusRes.json();

              if (statusData.POWER === "ON") {
                return { device, status: "already_on" };
              }

              // Jika status "off", lakukan perintah untuk menyalakan
              const res = await fetch(device.cmd_relay_on || device.relay_command_on);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);

              const resData = await res.json();
              
              if (resData.POWER === "ON") {
                return { device, status: "success" };
              } else {
                return { device, status: "failed", reason: resData };
              }

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
                .map((_, i) => targetDevices[i])
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
            targetDevices.map((device) =>
              fetch(
                `http://localhost:3001/tv/${device.ip_address_tv}/volume/${volume}?port=5555&method=adb`
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
          targetDevices.map((device) =>
            fetch(`http://localhost:3001/tv/${device.ip_address_tv}/volume/0?port=5555&method=adb`)
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
              .map((_, i) => targetDevices[i])
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
      case "Cek Status IP": {
        const results = await Promise.allSettled(
          targetDevices.map(async (device) => {
            const relayCmd = device.cmd_relay_status;
            const tvCmd = device.cmd_check_power_tv || device.perintah_cek_power_tv;
            
            let relayStatus = "Error";
            let tvStatus = "Error";

            if (relayCmd) {
              try {
                const res = await fetch(relayCmd);
                if (res.ok) relayStatus = "Passed";
              } catch (e) {}
            }
            if (tvCmd) {
              try {
                const res = await fetch(tvCmd);
                if (res.ok) tvStatus = "Passed";
              } catch (e) {}
            }

            return {
              device,
              relay: relayStatus,
              tv: tvStatus,
              isOk: relayStatus === "Passed" && tvStatus === "Passed"
            };
          })
        );

        const passed = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.isOk)
          .map(r => r.value.device);
        
        const partial = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value.isOk)
          .map(r => r.value);

        Swal.fire({
          title: "Hasil Cek Status IP",
          html: `
            <div style='text-align: left'>
              <h4 style="font-weight: bold; color: green;">Passed (${passed.length}):</h4>
              <ul>
                ${passed.map(d => `<li>${d.name}</li>`).join('')}
              </ul>
              <h4 style="font-weight: bold; color: red; margin-top: 10px;">Error / Partial (${partial.length}):</h4>
              <ul>
                ${partial.map(p => `
                  <li>
                    <strong>${p.device.name}</strong>: 
                    Relay (${p.relay === 'Passed' ? '✅' : '❌'}), 
                    TV (${p.tv === 'Passed' ? '✅' : '❌'})
                  </li>
                `).join('')}
              </ul>
            </div>
          `,
          icon: "info",
          confirmButtonText: "Tutup"
        });
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

            <div className="ml-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-checkbox"
                checked={displayedDevices.length > 0 && selectedDevices.length === displayedDevices.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDevices(displayedDevices.map(d => d.id));
                  } else {
                    setSelectedDevices([]);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="select-all-checkbox" className="text-sm font-medium text-gray-700 cursor-pointer">
                Pilih Semua
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={runIpCheckModal}
                className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200"
              >
                IP Check
              </button>
              <button
                onClick={runCommandCheckModal}
                className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200"
              >
                Check Perintah
              </button>
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
            <option value="Cek Status IP">Cek Status IP (Relay & TV)</option>
            
          </select>
          {selectedCommand === "Set Volume" && (
            <>
              <div className="text-sm font-semibold text-slate-700">Volume</div>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => {e.target.value===""?setVolume(15):setVolume(Number(e.target.value))}}
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
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(d.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDevices(prev => [...prev, d.id]);
                      } else {
                        setSelectedDevices(prev => prev.filter(id => id !== d.id));
                      }
                    }}
                    className="h-5 w-5 rounded border-transparent text-blue-600 focus:ring-offset-purple-500 focus:ring-blue-500 cursor-pointer"
                  />
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
                            onClick={async () => {
                              try {
                                // Periksa apakah ada perintah relay yang valid
                                const relayCommand =
                                  d.cmd_relay_on || d.relay_command_on;
                                if (relayCommand) {
                                  // Lakukan fetch ke perintah relay (relay_command_on)
                                  const response = await fetch(relayCommand);

                                  // Jika fetch berhasil, tampilkan Swal.fire
                                  if (response.ok) {
                                    Swal.fire({
                                      title: "Perintah Relay ON",
                                      html: `<pre style='text-align:left'>${relayCommand}</pre>`,
                                      icon: "success",
                                      text: "Perintah relay berhasil dijalankan!",
                                    });
                                  } else {
                                    // Jika fetch gagal, tampilkan Swal.fire dengan error
                                    const errorText = await response.text();
                                    Swal.fire({
                                      title: "Gagal Menjalankan Perintah Relay",
                                      html: `<pre style='text-align:left'>${errorText}</pre>`,
                                      icon: "error",
                                      text: `Error: ${response.status}`,
                                    });
                                  }
                                } else {
                                  // Jika tidak ada perintah relay yang valid
                                  Swal.fire({
                                    title: "Tidak Ada Perintah Relay",
                                    html: "<pre style='text-align:left'>Perintah relay tidak tersedia.</pre>",
                                    icon: "info",
                                  });
                                }
                              } catch (error) {
                                // Tangani error jika fetch gagal
                                console.error(
                                  "Error menjalankan perintah relay:",
                                  error
                                );
                                Swal.fire({
                                  title: "Gagal Menjalankan Perintah Relay",
                                  html: "<pre style='text-align:left'>Terjadi kesalahan saat menjalankan perintah relay.</pre>",
                                  icon: "error",
                                  text: "Silakan coba lagi.",
                                });
                              }
                            }}
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
                            onClick={async () => {
                              try {
                                // Periksa apakah ada perintah relay yang valid
                                const relayCommand =
                                  d.cmd_relay_off || d.relay_command_off;
                                if (relayCommand) {
                                  // Lakukan fetch ke perintah relay (relay_command_on)
                                  const response = await fetch(relayCommand);

                                  // Jika fetch berhasil, tampilkan Swal.fire
                                  if (response.ok) {
                                    Swal.fire({
                                      title: "Perintah Relay OFF",
                                      html: `<pre style='text-align:left'>${relayCommand}</pre>`,
                                      icon: "success",
                                      text: "Perintah relay berhasil dijalankan!",
                                    });
                                  } else {
                                    // Jika fetch gagal, tampilkan Swal.fire dengan error
                                    const errorText = await response.text();
                                    Swal.fire({
                                      title: "Gagal Menjalankan Perintah Relay",
                                      html: `<pre style='text-align:left'>${errorText}</pre>`,
                                      icon: "error",
                                      text: `Error: ${response.status}`,
                                    });
                                  }
                                } else {
                                  // Jika tidak ada perintah relay yang valid
                                  Swal.fire({
                                    title: "Tidak Ada Perintah Relay",
                                    html: "<pre style='text-align:left'>Perintah relay tidak tersedia.</pre>",
                                    icon: "info",
                                  });
                                }
                              } catch (error) {
                                // Tangani error jika fetch gagal
                                console.error(
                                  "Error menjalankan perintah relay:",
                                  error
                                );
                                Swal.fire({
                                  title: "Gagal Menjalankan Perintah Relay",
                                  html: "<pre style='text-align:left'>Terjadi kesalahan saat menjalankan perintah relay.</pre>",
                                  icon: "error",
                                  text: "Silakan coba lagi.",
                                });
                              }
                            }}
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
                            onClick={async () => {
                              try {
                                // Periksa apakah ada perintah relay yang valid
                                const relayCommand =
                                  d.cmd_relay_status || d.relay_command_status;
                                if (relayCommand) {
                                  // Lakukan fetch ke perintah relay (relay_command_on)
                                  const response = await fetch(relayCommand);

                                  if (response.ok) {
                                    const responseText = await response.text();

                                    // Tampilkan SweetAlert
                                    Swal.fire({
                                      title: "Perintah Relay Status",
                                      html: `<pre style='text-align:left'>${responseText}</pre>`,
                                      icon: "success",
                                      text: "Perintah relay berhasil dijalankan!",
                                    });
                                  } else {
                                    const errorText = await response.text();

                                    Swal.fire({
                                      title: "Gagal Menjalankan Perintah Relay",
                                      html: `<pre style='text-align:left'>${errorText}</pre>`,
                                      icon: "error",
                                      text: `Error: ${response.status} - ${errorText}`,
                                    });
                                  }
                                } else {
                                  Swal.fire({
                                    title: "Tidak Ada Perintah Relay",
                                    html: "<pre style='text-align:left'>Perintah relay tidak tersedia.</pre>",
                                    icon: "info",
                                  });
                                }
                              } catch (error) {
                                console.error(
                                  "Error menjalankan perintah relay:",
                                  error
                                );
                                Swal.fire({
                                  title: "Gagal Menjalankan Perintah Relay",
                                  html: "<pre style='text-align:left'>Terjadi kesalahan saat menjalankan perintah relay.</pre>",
                                  icon: "error",
                                  text: "Silakan coba lagi.",
                                });
                              }
                            }}
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
                            onClick={async () => {
                              try {
                                const tvCommand =
                                  d.cmd_power_tv || d.power_tv_command;
                                if (tvCommand) {
                                  const response = await fetch(tvCommand);

                                  // Jika fetch berhasil
                                  if (response.ok) {
                                    Swal.fire({
                                      title: "Perintah Power TV",
                                      html: `<pre style='text-align:left'>${tvCommand}</pre>`,
                                      icon: "success",
                                      text: "Perintah Power TV berhasil dijalankan!",
                                    });
                                  } else {
                                    // Jika fetch gagal
                                    const errorText = await response.text();
                                    Swal.fire({
                                      title:
                                        "Gagal Menjalankan Perintah Power TV",
                                      html: `<pre style='text-align:left'>${errorText}</pre>`,
                                      icon: "error",
                                      text: `Error: ${response.status}`,
                                    });
                                  }
                                } else {
                                  // Jika tidak ada perintah relay yang valid
                                  Swal.fire({
                                    title: "Tidak Ada Perintah Valid",
                                    html: "<pre style='text-align:left'>Perintah tidak tersedia.</pre>",
                                    icon: "info",
                                  });
                                }
                              } catch (error) {
                                console.error(
                                  "Error menjalankan perintah Tv:",
                                  error
                                );
                                Swal.fire({
                                  title: "Gagal Menjalankan Perintah TV",
                                  html: "<pre style='text-align:left'>Terjadi kesalahan saat menjalankan perintah Tv.</pre>",
                                  icon: "error",
                                  text: "Silakan coba lagi.",
                                });
                              }
                            }}
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
                            onClick={async () => {
                              try {
                                const tvCommand =
                                  d.cmd_check_power_tv ||
                                  d.perintah_cek_power_tv;
                                if (tvCommand) {
                                  const response = await fetch(tvCommand);

                                  // Jika fetch berhasil
                                  if (response.ok) {
                                    Swal.fire({
                                      title: "Perintah Cek Status TV",
                                      html: `<pre style='text-align:left'>${tvCommand}</pre>`,
                                      icon: "success",
                                      text: "Perintah Cek Status TV berhasil dijalankan!",
                                    });
                                  } else {
                                    // Jika fetch gagal
                                    const errorText = await response.text();
                                    Swal.fire({
                                      title:
                                        "Gagal Menjalankan Perintah Cek Status TV",
                                      html: `<pre style='text-align:left'>${errorText}</pre>`,
                                      icon: "error",
                                      text: `Error: ${response.status}`,
                                    });
                                  }
                                } else {
                                  // Jika tidak ada perintah
                                  Swal.fire({
                                    title: "Tidak Ada Perintah Valid",
                                    html: "<pre style='text-align:left'>Perintah tidak tersedia.</pre>",
                                    icon: "info",
                                  });
                                }
                              } catch (error) {
                                console.error(
                                  "Error menjalankan perintah TV:",
                                  error
                                );
                                Swal.fire({
                                  title:
                                    "Gagal Menjalankan Perintah Cek Status TV",
                                  html: "<pre style='text-align:left'>Terjadi kesalahan saat menjalankan perintah Cek Status TV.</pre>",
                                  icon: "error",
                                  text: "Silakan coba lagi.",
                                });
                              }
                            }}
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
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevices(prev => [...prev, d.id]);
                          } else {
                            setSelectedDevices(prev => prev.filter(id => id !== d.id));
                          }
                        }}
                        className="h-5 w-5 rounded border-transparent text-blue-600 focus:ring-offset-purple-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="text-right">
                        <div className="text-sm">Total</div>
                        <div className="text-lg font-bold">Rp {displayTotal}</div>
                      </div>
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
                    <input
                      type="checkbox"
                      checked={displayedDevices.length > 0 && selectedDevices.length === displayedDevices.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDevices(displayedDevices.map(d => d.id));
                        } else {
                          setSelectedDevices([]);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
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
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : displayedDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No devices found
                    </td>
                  </tr>
                ) : (
                  displayedDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDevices(prev => [...prev, d.id]);
                            } else {
                              setSelectedDevices(prev => prev.filter(id => id !== d.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
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
