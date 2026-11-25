
import { useState, useEffect, useCallback } from "react";

import {
  ShieldCheck,
  LayoutDashboard,
  FileCode,
  ShieldAlert,
  Activity,
  Settings,
  Blocks,
  LockKeyhole,
  UploadCloud,
  CheckCircle2,
  ArrowUpRight,
  X,
  LoaderCircle,
  Search,
  AlertTriangle,
  RefreshCw,
  Clock,
  ClipboardList,
  Filter,
} from "lucide-react";

const API_URL = "http://127.0.0.1:5001";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [backendStatus, setBackendStatus] = useState("Checking...");

  // Registration states
  const [contractId, setContractId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Verification states
  const [verifyContractId, setVerifyContractId] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState("");

  // Activity log states
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [logFilter, setLogFilter] = useState("ALL");

  // Check backend connection
  useEffect(() => {
    let isMounted = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
          throw new Error("Backend connection failed");
        }

        const data = await response.json();

        if (isMounted) {
          setBackendStatus(
            data.blockchain_connected && data.contract_connected
              ? "Blockchain Online"
              : "Blockchain Offline"
          );
        }
      } catch {
        if (isMounted) {
          setBackendStatus("Backend Offline");
        }
      }
    };

    checkBackend();

    const interval = setInterval(checkBackend, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError("");

    try {
      const response = await fetch(`${API_URL}/api/logs`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Unable to fetch activity logs.");
      }

      setActivityLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (error) {
      setLogsError(
        error.message || "Unable to connect to activity logs API."
      );
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Load logs when Activity Logs page opens
  useEffect(() => {
    if (activePage !== "Activity Logs") return;

    const timer = setTimeout(() => {
      fetchActivityLogs();
    }, 0);

    return () => clearTimeout(timer);
  }, [activePage, fetchActivityLogs]);
  // Register smart contract
  const handleRegister = async (event) => {
    event.preventDefault();

    setRegistrationResult(null);
    setErrorMessage("");

    if (!contractId.trim()) {
      setErrorMessage("Please enter a Contract ID.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select a Solidity file.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".sol")) {
      setErrorMessage("Only Solidity (.sol) files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("contract_id", contractId.trim());
    formData.append("file", selectedFile);

    try {
      setRegistering(true);

      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Registration failed.");
      }

      setRegistrationResult(data);
      setContractId("");
      setSelectedFile(null);

      const fileInput = document.getElementById("solidity-file");
      if (fileInput) {
        fileInput.value = "";
      }

      // Update logs if Activity Logs page is currently open
      if (activePage === "Activity Logs") {
        fetchActivityLogs();
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to connect to backend.");
    } finally {
      setRegistering(false);
    }
  };

  // Verify smart contract integrity
  const handleVerify = async (event) => {
    event.preventDefault();

    setVerificationResult(null);
    setVerificationError("");

    if (!verifyContractId.trim()) {
      setVerificationError("Please enter the registered Contract ID.");
      return;
    }

    if (!verifyFile) {
      setVerificationError("Please select a Solidity file.");
      return;
    }

    if (!verifyFile.name.toLowerCase().endsWith(".sol")) {
      setVerificationError("Only Solidity (.sol) files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("contract_id", verifyContractId.trim());
    formData.append("file", verifyFile);

    try {
      setVerifying(true);

      const response = await fetch(`${API_URL}/api/verify`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification request failed.");
      }

      const rawStatus = String(
        data.result ||
        data.verification_status ||
        data.status ||
        ""
      ).toUpperCase();

      let outcome = rawStatus;

      if (data.is_valid === true || data.verified === true) {
        outcome = "VERIFIED";
      } else if (data.is_valid === false || data.verified === false) {
        outcome = "TAMPERED";
      }

      if (outcome === "SUCCESS" && data.result) {
        outcome = String(data.result).toUpperCase();
      }

      setVerificationResult({
        ...data,
        outcome,
      });

      setVerifyContractId("");
      setVerifyFile(null);

      const fileInput = document.getElementById("verify-solidity-file");
      if (fileInput) {
        fileInput.value = "";
      }

      if (activePage === "Activity Logs") {
        fetchActivityLogs();
      }
    } catch (error) {
      setVerificationError(
        error.message || "Unable to connect to verification service."
      );
    } finally {
      setVerifying(false);
    }
  };

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Register Contract", icon: FileCode },
    { name: "Verify Integrity", icon: ShieldCheck },
    { name: "Activity Logs", icon: Activity },
  ];

  const verificationOutcome = verificationResult?.outcome;

  const isVerified = verificationOutcome === "VERIFIED";
  const isTampered = verificationOutcome === "TAMPERED";
  const isNotFound =
    verificationOutcome === "NOT_FOUND" ||
    verificationOutcome === "NOT FOUND";

  const filteredLogs = activityLogs.filter((log) => {
    if (logFilter === "ALL") return true;
    return String(log.result || "").toUpperCase() === logFilter;
  });

  const verifiedCount = activityLogs.filter(
    (log) => String(log.result).toUpperCase() === "VERIFIED"
  ).length;

  const tamperedCount = activityLogs.filter(
    (log) => String(log.result).toUpperCase() === "TAMPERED"
  ).length;

  const registeredCount = activityLogs.filter(
    (log) => String(log.result).toUpperCase() === "REGISTERED"
  ).length;

  return (
    <div className="min-h-screen bg-[#080d19] text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-[#0c1424] p-6">

        <div className="flex items-center gap-3 mb-12">
          <div className="bg-cyan-400/10 p-2 rounded-xl">
            <ShieldCheck size={28} className="text-cyan-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold">SmartGuard</h1>
            <p className="text-xs text-slate-400">Blockchain Security</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">
          Main Menu
        </p>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${activePage === item.name
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <Icon size={19} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-slate-800/50 border border-slate-700 p-4">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <LockKeyhole size={17} />
            <span className="text-sm font-semibold">Secure System</span>
          </div>

          <p className="text-xs text-slate-400 leading-5">
            Smart contract integrity protection powered by blockchain.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-9 min-w-0">

        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <p className="text-sm text-slate-400">
              SmartGuard / {activePage}
            </p>

            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              {activePage}
            </h2>

            <p className="text-sm text-slate-400 mt-2">
              Monitor and protect your smart contract integrity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 rounded-full">
              <span
                className={`w-2 h-2 rounded-full ${backendStatus === "Backend Offline"
                  ? "bg-rose-400"
                  : backendStatus === "Blockchain Offline"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                  }`}
              ></span>

              <span className="text-xs text-emerald-400">
                {backendStatus}
              </span>
            </div>

            <button
              type="button"
              aria-label="Settings"
              className="p-3 rounded-xl bg-slate-800 text-slate-300"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Dashboard */}
        {activePage === "Dashboard" && (
          <>
            <section className="rounded-2xl p-7 md:p-9 mb-8 border border-cyan-400/20 bg-gradient-to-r from-cyan-950/70 to-indigo-950/70">
              <div className="flex flex-col md:flex-row justify-between gap-6 items-center">
                <div>
                  <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
                    Blockchain Integrity Platform
                  </span>

                  <h3 className="text-2xl md:text-3xl font-bold mt-3">
                    Welcome to SmartGuard
                  </h3>

                  <p className="text-slate-300 text-sm mt-3 max-w-xl leading-6">
                    Register smart contracts, verify their integrity, and
                    detect unauthorized source-code modifications using
                    blockchain.
                  </p>
                </div>

                <div className="bg-cyan-400/10 p-6 rounded-2xl">
                  <ShieldCheck size={65} className="text-cyan-400" />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-9">
              <StatCard
                title="Registered Contracts"
                value={registeredCount}
                icon={FileCode}
                color="text-cyan-400"
              />

              <StatCard
                title="Verified Contracts"
                value={verifiedCount}
                icon={CheckCircle2}
                color="text-emerald-400"
              />

              <StatCard
                title="Tampered Contracts"
                value={tamperedCount}
                icon={ShieldAlert}
                color="text-rose-400"
              />

              <StatCard
                title="Blockchain Network"
                value="Ganache"
                icon={Blocks}
                color="text-violet-400"
              />
            </section>

            <section className="mb-9">
              <h3 className="text-lg font-semibold mb-5">Quick Actions</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ActionCard
                  icon={UploadCloud}
                  title="Register Smart Contract"
                  description="Upload your Solidity source file and register its SHA-256 hash on the blockchain."
                  button="Register Contract"
                  onClick={() => setActivePage("Register Contract")}
                />

                <ActionCard
                  icon={ShieldCheck}
                  title="Verify Contract Integrity"
                  description="Compare an uploaded contract's hash with its original blockchain record."
                  button="Verify Contract"
                  onClick={() => setActivePage("Verify Integrity")}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-[#0c1424] border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <Blocks className="text-cyan-400" size={22} />
                <h3 className="font-semibold">
                  Blockchain Network Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <NetworkInfo
                  label="Network"
                  value="Ganache Local Network"
                />
                <NetworkInfo label="Chain ID" value="1337" />
                <NetworkInfo
                  label="RPC Endpoint"
                  value="127.0.0.1:7545"
                />
              </div>
            </section>
          </>
        )}

        {/* Register contract */}
        {activePage === "Register Contract" && (
          <section className="max-w-3xl mx-auto">
            <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-cyan-400/10 p-3 rounded-xl">
                  <FileCode size={25} className="text-cyan-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold">
                    Register Smart Contract
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Secure your Solidity source code on blockchain.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-6 mt-8">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contract ID
                  </label>

                  <input
                    type="text"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    placeholder="Example: MyFirstContract"
                    className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Solidity File
                  </label>

                  <label
                    htmlFor="solidity-file"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-8 cursor-pointer transition bg-[#080d19]"
                  >
                    <UploadCloud size={38} className="text-cyan-400 mb-3" />

                    <span className="text-sm font-medium">
                      Click to upload your Solidity file
                    </span>

                    <span className="text-xs text-slate-500 mt-2">
                      Only .sol files are supported
                    </span>

                    {selectedFile && (
                      <span className="text-sm text-cyan-400 mt-4">
                        Selected: {selectedFile.name}
                      </span>
                    )}

                    <input
                      id="solidity-file"
                      type="file"
                      accept=".sol"
                      className="hidden"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        setErrorMessage("");
                        setRegistrationResult(null);
                      }}
                    />
                  </label>
                </div>

                {errorMessage && (
                  <div className="flex gap-3 items-start bg-rose-400/10 border border-rose-400/20 rounded-xl p-4 text-rose-400 text-sm">
                    <X size={19} />
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl py-4 transition"
                >
                  {registering ? (
                    <>
                      <LoaderCircle size={19} className="animate-spin" />
                      Registering on Blockchain...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={19} />
                      Register Contract
                    </>
                  )}
                </button>
              </form>
            </div>

            {registrationResult && (
              <div className="mt-6 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <CheckCircle2 size={28} className="text-emerald-400" />

                  <div>
                    <h3 className="font-bold text-emerald-400">
                      Registration Successful!
                    </h3>
                    <p className="text-xs text-slate-400">
                      Your contract hash has been recorded on Ganache.
                    </p>
                  </div>
                </div>

                <ResultInfo
                  label="Contract ID"
                  value={registrationResult.contract_id}
                />
                <ResultInfo
                  label="SHA-256 Hash"
                  value={registrationResult.sha256_hash}
                />
                <ResultInfo
                  label="Transaction Hash"
                  value={registrationResult.transaction_hash}
                />
                <ResultInfo
                  label="Block Number"
                  value={String(registrationResult.block_number)}
                />
              </div>
            )}
          </section>
        )}

        {/* Verify integrity */}
        {activePage === "Verify Integrity" && (
          <section className="max-w-3xl mx-auto">
            <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-cyan-400/10 p-3 rounded-xl">
                  <ShieldCheck size={25} className="text-cyan-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold">
                    Verify Contract Integrity
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Compare your Solidity file with its blockchain record.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-6 mt-8">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contract ID
                  </label>

                  <input
                    type="text"
                    value={verifyContractId}
                    onChange={(e) => setVerifyContractId(e.target.value)}
                    placeholder="Example: TestContract001"
                    className="w-full bg-[#080d19] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />

                  <p className="text-xs text-slate-500 mt-2">
                    Enter the same ID used during registration.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Solidity File
                  </label>

                  <label
                    htmlFor="verify-solidity-file"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-8 cursor-pointer transition bg-[#080d19]"
                  >
                    <UploadCloud size={38} className="text-cyan-400 mb-3" />

                    <span className="text-sm font-medium">
                      Click to upload Solidity file
                    </span>

                    <span className="text-xs text-slate-500 mt-2">
                      Upload the original or modified .sol file
                    </span>

                    {verifyFile && (
                      <span className="text-sm text-cyan-400 mt-4">
                        Selected: {verifyFile.name}
                      </span>
                    )}

                    <input
                      id="verify-solidity-file"
                      type="file"
                      accept=".sol"
                      className="hidden"
                      onChange={(e) => {
                        setVerifyFile(e.target.files?.[0] || null);
                        setVerificationError("");
                        setVerificationResult(null);
                      }}
                    />
                  </label>
                </div>

                {verificationError && (
                  <div className="flex gap-3 items-start bg-rose-400/10 border border-rose-400/20 rounded-xl p-4 text-rose-400 text-sm">
                    <X size={19} />
                    {verificationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl py-4 transition"
                >
                  {verifying ? (
                    <>
                      <LoaderCircle size={19} className="animate-spin" />
                      Verifying on Blockchain...
                    </>
                  ) : (
                    <>
                      <Search size={19} />
                      Verify Contract Integrity
                    </>
                  )}
                </button>
              </form>
            </div>

            {verificationResult && (
              <div
                className={`mt-6 rounded-2xl p-6 border ${isVerified
                  ? "bg-emerald-400/10 border-emerald-400/30"
                  : isTampered
                    ? "bg-rose-400/10 border-rose-400/30"
                    : "bg-amber-400/10 border-amber-400/30"
                  }`}
              >
                <div className="flex items-center gap-3 mb-5">
                  {isVerified ? (
                    <CheckCircle2 size={30} className="text-emerald-400" />
                  ) : isTampered ? (
                    <ShieldAlert size={30} className="text-rose-400" />
                  ) : (
                    <AlertTriangle size={30} className="text-amber-400" />
                  )}

                  <div>
                    <h3
                      className={`font-bold text-lg ${isVerified
                        ? "text-emerald-400"
                        : isTampered
                          ? "text-rose-400"
                          : "text-amber-400"
                        }`}
                    >
                      {isVerified
                        ? "CONTRACT VERIFIED"
                        : isTampered
                          ? "CONTRACT TAMPERED"
                          : isNotFound
                            ? "CONTRACT NOT FOUND"
                            : "VERIFICATION RESPONSE"}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      {isVerified
                        ? "The uploaded file matches the blockchain record."
                        : isTampered
                          ? "The uploaded file does not match the registered hash."
                          : isNotFound
                            ? "No registered contract was found with this ID."
                            : verificationResult.message ||
                            "Verification completed."}
                    </p>
                  </div>
                </div>

                <ResultInfo
                  label="Contract ID"
                  value={verificationResult.contract_id || "—"}
                />

                <ResultInfo
                  label="Uploaded File SHA-256"
                  value={verificationResult.uploaded_hash || "Not provided by backend"}
                />

                <ResultInfo
                  label="Registered Blockchain SHA-256"
                  value={verificationResult.registered_hash || "Not provided by backend"}
                />

                {verificationResult.message && (
                  <p className="text-xs text-slate-400 mt-3">
                    {verificationResult.message}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Activity logs */}
        {activePage === "Activity Logs" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
              <div>
                <h3 className="text-xl font-bold">
                  System Activity History
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Track contract registration and verification activities.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchActivityLogs}
                disabled={logsLoading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition"
              >
                <RefreshCw
                  size={17}
                  className={logsLoading ? "animate-spin" : ""}
                />
                Refresh Logs
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <LogStatCard
                title="Total Activities"
                value={activityLogs.length}
                icon={ClipboardList}
                color="text-cyan-400"
              />
              <LogStatCard
                title="Registered"
                value={registeredCount}
                icon={FileCode}
                color="text-violet-400"
              />
              <LogStatCard
                title="Verified"
                value={verifiedCount}
                icon={CheckCircle2}
                color="text-emerald-400"
              />
              <LogStatCard
                title="Tampered"
                value={tamperedCount}
                icon={ShieldAlert}
                color="text-rose-400"
              />
            </div>

            <div className="bg-[#0c1424] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                <div>
                  <h3 className="font-semibold text-lg">Recent Activities</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Records retrieved from SmartGuard backend.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#080d19] border border-slate-700 rounded-xl px-3 py-2">
                  <Filter size={16} className="text-cyan-400" />

                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="bg-transparent text-sm text-slate-200 outline-none"
                  >
                    <option className="bg-slate-900" value="ALL">All Activities</option>
                    <option className="bg-slate-900" value="REGISTERED">Registered</option>
                    <option className="bg-slate-900" value="VERIFIED">Verified</option>
                    <option className="bg-slate-900" value="TAMPERED">Tampered</option>
                    <option className="bg-slate-900" value="NOT_FOUND">Not Found</option>
                  </select>
                </div>
              </div>

              {logsError && (
                <div className="m-5 flex gap-3 items-start bg-rose-400/10 border border-rose-400/20 rounded-xl p-4 text-rose-400 text-sm">
                  <AlertTriangle size={19} />
                  <div>
                    <p className="font-semibold">
                      Unable to load activity logs
                    </p>
                    <p className="mt-1">{logsError}</p>
                  </div>
                </div>
              )}

              {logsLoading && activityLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <LoaderCircle
                    size={35}
                    className="animate-spin text-cyan-400 mx-auto"
                  />
                  <p className="text-sm text-slate-400 mt-4">
                    Loading activity history...
                  </p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity
                    size={42}
                    className="text-slate-600 mx-auto mb-4"
                  />
                  <h4 className="font-semibold text-slate-300">
                    {activityLogs.length === 0
                      ? "No Activity Found"
                      : "No Matching Activities"}
                  </h4>
                  <p className="text-sm text-slate-500 mt-2">
                    {activityLogs.length === 0
                      ? "Register or verify a smart contract to create your first activity record."
                      : "Try selecting a different activity filter."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[750px]">
                    <thead className="bg-[#080d19] text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Contract ID</th>
                        <th className="px-6 py-4">Activity</th>
                        <th className="px-6 py-4">Result</th>
                        <th className="px-6 py-4">Message</th>
                        <th className="px-6 py-4">Timestamp</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {filteredLogs.map((log, index) => (
                        <tr
                          key={`${log.contract_id}-${log.timestamp}-${index}`}
                          className="hover:bg-slate-800/30 transition"
                        >
                          <td className="px-6 py-5">
                            <span className="font-mono text-sm text-cyan-400">
                              {log.contract_id || "—"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm text-slate-200">
                              {log.activity || "—"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge status={log.result} />
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm text-slate-400">
                              {log.message || "—"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                              <Clock size={14} className="text-cyan-400" />
                              {log.timestamp || "—"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
                Showing {filteredLogs.length} of {activityLogs.length} activities
              </div>
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-slate-500 mt-10">
          SmartGuard © 2026 | Blockchain-Based Smart Contract Integrity System
        </footer>
      </main>
    </div>
  );
}


// Dashboard statistics card
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={21} className={color} />
      </div>
      <h3 className="text-2xl font-bold mt-5">{value}</h3>
      <p className="text-xs text-slate-500 mt-2">SmartGuard overview</p>
    </div>
  );
}


// Activity log statistics card
function LogStatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={21} className={color} />
      </div>
      <h3 className="text-3xl font-bold mt-5">{value}</h3>
      <p className="text-xs text-slate-500 mt-2">Recorded activities</p>
    </div>
  );
}


// Activity status badge
function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toUpperCase();

  const styles = {
    REGISTERED: "bg-violet-400/10 text-violet-400 border-violet-400/20",
    VERIFIED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    TAMPERED: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    NOT_FOUND: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${styles[normalizedStatus] ||
        "bg-slate-400/10 text-slate-400 border-slate-400/20"
        }`}
    >
      {normalizedStatus || "UNKNOWN"}
    </span>
  );
}


// Action card
function ActionCard({ icon: Icon, title, description, button, onClick }) {
  return (
    <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-6 hover:border-cyan-400/40 transition">
      <div className="bg-cyan-400/10 w-fit p-3 rounded-xl mb-5">
        <Icon size={25} className="text-cyan-400" />
      </div>

      <h4 className="text-lg font-semibold">{title}</h4>

      <p className="text-sm text-slate-400 mt-3 leading-6">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-6 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl transition"
      >
        {button}
        <ArrowUpRight size={17} />
      </button>
    </div>
  );
}


// Network information
function NetworkInfo({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}


// Result information
function ResultInfo({ label, value }) {
  return (
    <div className="mb-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm text-slate-200 break-all font-mono">
        {value}
      </p>
    </div>
  );
}

export default App;
