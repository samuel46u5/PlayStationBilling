import React, { useState, useEffect } from "react";
import {
  getCurrentDeviceId,
  setAuthorizedDevice,
  getDeviceInfo,
  ensureFingerprintReady,
} from "../utils/deviceFingerprint.ts";
import { Shield, Check, X, Monitor, Smartphone, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

interface DeviceAuthorizationSettingsProps {
  className?: string;
}

export const DeviceAuthorizationSettings: React.FC<
  DeviceAuthorizationSettingsProps
> = ({ className = "" }) => {
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [authorizedDeviceId, setAuthorizedDeviceId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    ensureFingerprintReady();
    loadDeviceData();
    // Refresh once after FPJS likely finishes to capture visitorId
    const t = setTimeout(() => {
      loadDeviceData();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const loadDeviceData = async () => {
    try {
      const currentId = getCurrentDeviceId();
      setCurrentDeviceId(currentId);

      const info = await getDeviceInfo();
      setDeviceInfo(info);
      setAuthorizedDeviceId(info.authorizedDeviceId);
    } catch (error) {
      console.error("Error loading device data:", error);
    }
  };

  const handleSetAsAuthorized = async () => {
    if (!currentDeviceId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Tidak dapat mendapatkan Device ID saat ini",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await setAuthorizedDevice(currentDeviceId);

      if (success) {
        setAuthorizedDeviceId(currentDeviceId);
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Device ini telah diatur sebagai device yang authorized",
          timer: 2000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Gagal mengatur device sebagai authorized",
        });
      }
    } catch (error) {
      console.error("Error setting authorized device:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat mengatur device",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAuthorization = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus authorization device?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const success = await setAuthorizedDevice("");

        if (success) {
          setAuthorizedDeviceId(null);
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Authorization device telah dihapus",
            timer: 2000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Gagal menghapus authorization device",
          });
        }
      } catch (error) {
        console.error("Error clearing authorization:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Terjadi kesalahan saat menghapus authorization",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isCurrentDeviceAuthorized = currentDeviceId === authorizedDeviceId;

  const getDeviceTypeIcon = () => {
    if (!deviceInfo?.fingerprint) return <Monitor className="w-4 h-4" />;

    const isMobile =
      deviceInfo.fingerprint.touchSupport ||
      deviceInfo.fingerprint.userAgent.includes("Mobile");

    return isMobile ? (
      <Smartphone className="w-4 h-4" />
    ) : (
      <Monitor className="w-4 h-4" />
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Device Authorization
          </h3>
        </div>

        {/* Current Device Info */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Device Saat Ini
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getDeviceTypeIcon()}
              <span className="text-sm font-medium text-gray-900">
                {deviceInfo?.fingerprint?.platform || "Unknown Platform"}
              </span>
              {isCurrentDeviceAuthorized && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-medium">Authorized</span>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div>Device ID: {currentDeviceId || "Loading..."}</div>
              <div>
                Screen: {deviceInfo?.fingerprint?.screenResolution || "Unknown"}
              </div>
              <div>
                Browser:{" "}
                {deviceInfo?.fingerprint?.userAgent?.split(" ")[0] || "Unknown"}
              </div>
              <div>
                Language: {deviceInfo?.fingerprint?.language || "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSetAsAuthorized}
            disabled={isLoading || isCurrentDeviceAuthorized}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCurrentDeviceAuthorized
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Shield className="w-4 h-4" />
            {isLoading ? "Mengatur..." : "Set sebagai Authorized"}
          </button>

          {authorizedDeviceId && (
            <button
              onClick={handleClearAuthorization}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Hapus Authorization
            </button>
          )}

          <button
            onClick={loadDeviceData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Status Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Info:</strong> Device yang authorized akan menjadi
            satu-satunya device yang dapat melakukan pemotongan points member
            card dan operasi sistem lainnya.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceAuthorizationSettings;
