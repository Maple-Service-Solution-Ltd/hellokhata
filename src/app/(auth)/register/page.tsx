"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  Store,
  Sparkles,
  CheckCircle2,
  User,
  Building2,
  ArrowLeft,
  Search,
  ChevronDown,
  EyeOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/stores/sessionStore";
import {
  useRegisterUser,
  useVerifyOTP,
  useResendOTP,
} from "@/hooks/api/useUser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { setSessionFromAuthResponse } = useSessionStore();

  const [step, setStep] = useState<"register" | "otp">("register");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("retail");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [demoOTP, setDemoOTP] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [businessTypeSearch, setBusinessTypeSearch] = useState("");
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] =
    useState(false);
  const registerUser = useRegisterUser();
  const verifyOTP = useVerifyOTP();
  const resendOTP = useResendOTP();

  const handleSuccess = () => {
    router.push("/");
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 6) {
      toast.error("Invalid OTP", {
        description: "Please enter the 6-digit OTP",
      });
      return;
    }

    verifyOTP.mutate(
      { uuid: userId, code: otp },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast.success(data.message);

            setSessionFromAuthResponse(data);
            router.push("/");
          }
        },
      },
    );
  };

  const handleResendOTP = () => {
    const obj = { userId, purpose: "signup" };
    resendOTP.mutate(obj, {
      onSuccess: (data) => {
        setDemoOTP(data.data.otp);
        toast.info("OTP Resent!");
      },
    });
  };

  const handleRegister = () => {
    if (!phone || !/^01[3-9]\d{8}$/.test(phone)) {
      toast.error("Invalid phone number", {
        description: "Please enter a valid Bangladeshi phone number",
      });
      return;
    }

    if (!name || name.length < 2) {
      toast.error("Name required", {
        description: "Please enter your full name",
      });
      return;
    }

    if (!businessName || businessName.length < 2) {
      toast.error("Business name required", {
        description: "Please enter your business name",
      });
      return;
    }

    const user = { name, phone, businessName, businessType, password };

    registerUser.mutate(user, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data.message);
          setUserId(data.data.userId);
          setStep("otp");
          setOtp("");
          setDemoOTP(data.data.otp);

          setCountdown(60);
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      },
    });
  };

  const businessTypes = [
    { value: "retail", label: "Retail Store", labelBn: "রিটেইল স্টোর" },
    { value: "wholesale", label: "Wholesale", labelBn: "পাইকারি" },
    { value: "grocery", label: "Grocery", labelBn: "মুদি দোকান" },
    { value: "pharmacy", label: "Pharmacy", labelBn: "ফার্মেসি" },
    { value: "electronics", label: "Electronics", labelBn: "ইলেকট্রনিক্স" },
    { value: "clothing", label: "Clothing", labelBn: "কাপড়ের দোকান" },
    { value: "restaurant", label: "Restaurant", labelBn: "রেস্টুরেন্ট" },
    { value: "other", label: "Other", labelBn: "অন্যান্য" },
  ];

  const filteredBusinessTypes = businessTypes.filter(
    (type) =>
      type.label.toLowerCase().includes(businessTypeSearch.toLowerCase()) ||
      type.labelBn.includes(businessTypeSearch),
  );

  const selectedBusinessType = businessTypes.find(
    (t) => t.value === businessType,
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundColor: "#0F141B" }}
      >
        <div
          className="absolute top-0 left-0 w-[600px] h-[500px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 5% 0%, rgba(79, 91, 255, 0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[400px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 90% 90%, rgba(20, 35, 55, 0.4) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(15, 191, 159, 0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-full md:max-w-2xl lg:max-w-3xl relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-4 shrink-0 relative"
            style={{
              background:
                "linear-gradient(135deg, #4F5BFF 0%, #6366F1 50%, #0FBF9F 100%)",
              boxShadow:
                "0 0 30px rgba(79, 91, 255, 0.3), 0 0 60px rgba(15, 191, 159, 0.15)",
            }}
          >
            <Store className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </motion.div>
          <h1
            className="text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap"
            style={{ color: "#E6EDF5" }}
          >
            Hello Khata
          </h1>
          <p
            className="text-muted-foreground mt-1 text-sm md:text-base whitespace-nowrap"
            style={{ color: "#9DA7B3" }}
          >
            আপনার ব্যবসার ডিজিটাল খাতা
          </p>
        </div>

        {/* Card */}
        <div
          className="px-6 py-6 md:px-10 md:py-8 lg:px-12 lg:py-10 rounded-xl w-full flex flex-col relative"
          style={{
            background:
              "linear-gradient(180deg, rgba(35, 46, 60, 1) 0%, rgba(28, 36, 48, 1) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 24px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)",
            }}
          />

          <AnimatePresence mode="wait">
            {step === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 md:gap-6 relative z-10"
              >
                <div className="shrink-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="p-1.5 rounded-lg transition-colors shrink-0 hover:bg-white/5"
                      style={{ color: "#9DA7B3" }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h2
                      className="text-xl md:text-2xl font-semibold whitespace-nowrap"
                      style={{ color: "#E6EDF5" }}
                    >
                      Create Account
                    </h2>
                  </div>
                  <p
                    className="text-sm md:text-base whitespace-nowrap mt-1 ml-10"
                    style={{ color: "#9DA7B3" }}
                  >
                    Set up your business account
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium whitespace-nowrap shrink-0"
                      style={{ color: "#E6EDF5" }}
                    >
                      Your Name *
                    </label>
                    <div className="relative w-full">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0"
                        style={{ color: "#6B7684" }}
                      />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 w-full h-12 md:h-14 text-base"
                        style={{
                          backgroundColor: "#171F29",
                          borderColor: "rgba(255, 255, 255, 0.05)",
                          color: "#E6EDF5",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium whitespace-nowrap shrink-0"
                      style={{ color: "#E6EDF5" }}
                    >
                      Business Name *
                    </label>
                    <div className="relative w-full">
                      <Building2
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0"
                        style={{ color: "#6B7684" }}
                      />
                      <Input
                        type="text"
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-12 w-full h-12 md:h-14 text-base"
                        style={{
                          backgroundColor: "#171F29",
                          borderColor: "rgba(255, 255, 255, 0.05)",
                          color: "#E6EDF5",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium whitespace-nowrap shrink-0"
                    style={{ color: "#E6EDF5" }}
                  >
                    Business Type
                  </label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() =>
                        setShowBusinessTypeDropdown(!showBusinessTypeDropdown)
                      }
                      className="w-full h-12 md:h-14 px-4 rounded-lg border flex items-center justify-between text-base text-left"
                      style={{
                        backgroundColor: "#171F29",
                        borderColor: showBusinessTypeDropdown
                          ? "#4F5BFF"
                          : "rgba(255, 255, 255, 0.05)",
                        color: "#E6EDF5",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        {selectedBusinessType?.label || "Select business type"}
                        {selectedBusinessType && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "rgba(79, 91, 255, 0.15)",
                              color: "#9DA7B3",
                            }}
                          >
                            {selectedBusinessType.labelBn}
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform shrink-0 ${showBusinessTypeDropdown ? "rotate-180" : ""}`}
                        style={{ color: "#6B7684" }}
                      />
                    </button>

                    {showBusinessTypeDropdown && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 rounded-lg border z-50 overflow-hidden"
                        style={{
                          backgroundColor: "#1A2230",
                          borderColor: "rgba(255, 255, 255, 0.08)",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        <div
                          className="relative border-b"
                          style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
                        >
                          <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0"
                            style={{ color: "#6B7684" }}
                          />
                          <input
                            type="text"
                            placeholder="Search business type..."
                            value={businessTypeSearch}
                            onChange={(e) =>
                              setBusinessTypeSearch(e.target.value)
                            }
                            className="w-full h-11 pl-11 pr-4 text-sm bg-transparent outline-none"
                            style={{ color: "#E6EDF5" }}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                          {filteredBusinessTypes.length > 0 ? (
                            filteredBusinessTypes.map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBusinessType(type.value);
                                  setShowBusinessTypeDropdown(false);
                                  setBusinessTypeSearch("");
                                }}
                                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                style={{
                                  backgroundColor:
                                    businessType === type.value
                                      ? "rgba(79, 91, 255, 0.1)"
                                      : "transparent",
                                }}
                              >
                                <div>
                                  <span
                                    className="text-sm font-medium"
                                    style={{
                                      color:
                                        businessType === type.value
                                          ? "#4F5BFF"
                                          : "#E6EDF5",
                                    }}
                                  >
                                    {type.label}
                                  </span>{" "}
                                  <span
                                    className="ml-2 text-xs"
                                    style={{ color: "#6B7684" }}
                                  >
                                    {type.labelBn}
                                  </span>
                                </div>
                                {businessType === type.value && (
                                  <CheckCircle2
                                    className="h-4 w-4 shrink-0"
                                    style={{ color: "#4F5BFF" }}
                                  />
                                )}
                              </button>
                            ))
                          ) : (
                            <div
                              className="px-4 py-3 text-sm text-center"
                              style={{ color: "#6B7684" }}
                            >
                              No business types found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium whitespace-nowrap shrink-0"
                    style={{ color: "#E6EDF5" }}
                  >
                    Phone Number *
                  </label>
                  <div className="relative w-full">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0"
                      style={{ color: "#6B7684" }}
                    />
                    <Input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                      }
                      className="pl-12 w-full h-12 md:h-14 text-base"
                      style={{
                        backgroundColor: "#171F29",
                        borderColor: "rgba(255, 255, 255, 0.05)",
                        color: "#E6EDF5",
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium whitespace-nowrap shrink-0"
                    style={{ color: "#E6EDF5" }}
                  >
                    Password *
                  </label>

                  <div className="relative w-full">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0"
                      style={{ color: "#6B7684" }}
                    />

                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 w-full h-12 md:h-14 text-base"
                      style={{
                        backgroundColor: "#171F29",
                        borderColor: "rgba(255, 255, 255, 0.05)",
                        color: "#E6EDF5",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff
                          className="h-5 w-5"
                          style={{ color: "#6B7684" }}
                        />
                      ) : (
                        <Eye className="h-5 w-5" style={{ color: "#6B7684" }} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium whitespace-nowrap shrink-0"
                    style={{ color: "#E6EDF5" }}
                  >
                    Confirm Password *
                  </label>

                  <div className="relative w-full">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0"
                      style={{ color: "#6B7684" }}
                    />

                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-12 w-full h-12 md:h-14 text-base"
                      style={{
                        backgroundColor: "#171F29",
                        borderColor: "rgba(255, 255, 255, 0.05)",
                        color: "#E6EDF5",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          className="h-5 w-5"
                          style={{ color: "#6B7684" }}
                        />
                      ) : (
                        <Eye className="h-5 w-5" style={{ color: "#6B7684" }} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p
                      className="text-xs text-red-500 mt-1"
                      style={{ color: "#FF6B6B" }}
                    >
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={
                    registerUser.isPending ||
                    phone.length !== 11 ||
                    !name ||
                    !businessName ||
                    !password ||
                    !confirmPassword ||
                    password !== confirmPassword
                  }
                  className="w-full shrink-0 h-12 md:h-14 font-medium text-base"
                  style={{
                    background:
                      "linear-gradient(135deg, #0FBF9F 0%, #1FAF86 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 0 20px rgba(15, 191, 159, 0.25)",
                  }}
                >
                  {registerUser.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="whitespace-nowrap">Create Account</span>
                      <Sparkles className="ml-2 h-5 w-5 shrink-0" />
                    </>
                  )}
                </Button>

                <p
                  className="text-xs md:text-sm text-center whitespace-nowrap shrink-0"
                  style={{ color: "#6B7684" }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium hover:underline"
                    style={{ color: "#4F5BFF" }}
                  >
                    Login instead
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 md:gap-6 relative z-10"
              >
                <div className="shrink-0">
                  <h2
                    className="text-xl md:text-2xl font-semibold whitespace-nowrap"
                    style={{ color: "#E6EDF5" }}
                  >
                    Verify & Complete Registration
                  </h2>
                  <p
                    className="text-sm md:text-base whitespace-nowrap mt-1"
                    style={{ color: "#9DA7B3" }}
                  >
                    Enter the code sent to {phone}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium whitespace-nowrap shrink-0"
                    style={{ color: "#E6EDF5" }}
                  >
                    Verification Code
                  </label>
                  <div className="relative w-full">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0"
                      style={{ color: "#6B7684" }}
                    />
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="pl-12 text-center tracking-widest w-full h-12 md:h-14 font-mono text-lg md:text-xl"
                      maxLength={6}
                      style={{
                        backgroundColor: "#171F29",
                        borderColor: "rgba(255, 255, 255, 0.05)",
                        color: "#E6EDF5",
                      }}
                    />
                  </div>
                </div>

                <p
                  className="text-xs md:text-sm text-center whitespace-nowrap shrink-0"
                  style={{ color: "#6B7684" }}
                >
                  Demo OTP:{" "}
                  <span
                    className="font-mono font-bold"
                    style={{ color: "#0FBF9F" }}
                  >
                    {demoOTP}
                  </span>
                </p>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifyOTP.isPending || otp.length !== 6}
                  className="w-full shrink-0 h-12 md:h-14 font-medium text-base"
                  style={{
                    background:
                      "linear-gradient(135deg, #4F5BFF 0%, #5E6AFF 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 0 20px rgba(79, 91, 255, 0.25)",
                  }}
                >
                  {verifyOTP.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="whitespace-nowrap">
                        Verify & Complete
                      </span>
                      <CheckCircle2 className="ml-2 h-5 w-5 shrink-0" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between shrink-0">
                  <button
                    onClick={() => setStep("register")}
                    className="text-sm md:text-base flex items-center gap-1 whitespace-nowrap transition-colors hover:opacity-80"
                    style={{ color: "#9DA7B3" }}
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                  </button>
                  <button
                    onClick={handleResendOTP}
                    disabled={countdown > 0}
                    className="text-sm md:text-base whitespace-nowrap transition-colors disabled:opacity-50"
                    style={{ color: countdown > 0 ? "#6B7684" : "#4F5BFF" }}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p
          className="text-center text-xs md:text-sm mt-6 whitespace-nowrap"
          style={{ color: "#6B7684" }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
