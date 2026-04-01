'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader2, Store, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/stores/sessionStore';
import { useLoginUser, useVerifyOTP, useResendOTP } from '@/hooks/api/useUser';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setSessionFromAuthResponse } = useSessionStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [demoOTP, setDemoOTP] = useState('');
  const [countdown, setCountdown] = useState(0);

  const verifyOTP = useVerifyOTP();
  const loginUser = useLoginUser();
  const resendOTP = useResendOTP();

  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP', { description: 'Please enter the 6-digit OTP' });
      return;
    }

    verifyOTP.mutate({ uuid: userId, code: otp }, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data.message);
          setSessionFromAuthResponse(data);
          router.push('/');
        }
      }
    });
  };

  const handleResendOTP = () => {
    const obj = { userId, purpose: 'signin' };
    resendOTP.mutate(obj, {
      onSuccess: (data) => {
        setDemoOTP(data.data.otp);
        toast.info('OTP Resent!');
      }
    });
  };

  const handleLogin = () => {
    if (!phone || !/^01[3-9]\d{8}$/.test(phone)) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid Bangladeshi phone number',
      });
      return;
    }

    loginUser.mutate({ phone }, {
      onSuccess: data => {
        if (data.success) {
          setUserId(data.userId);
          setStep('otp');
          setDemoOTP(data.code);
          setOtp('');
          toast.success('OTP Sent!');

          // Start Countdown
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
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: '#0F141B' }}>
        <div className="absolute top-0 left-0 w-[600px] h-[500px] opacity-30" style={{ background: 'radial-gradient(ellipse 80% 60% at 5% 0%, rgba(79, 91, 255, 0.15) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] opacity-30" style={{ background: 'radial-gradient(ellipse 60% 50% at 90% 90%, rgba(20, 35, 55, 0.4) 0%, transparent 60%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-20" style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(15, 191, 159, 0.08) 0%, transparent 70%)' }} />
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
              background: 'linear-gradient(135deg, #4F5BFF 0%, #6366F1 50%, #0FBF9F 100%)',
              boxShadow: '0 0 30px rgba(79, 91, 255, 0.3), 0 0 60px rgba(15, 191, 159, 0.15)'
            }}
          >
            <Store className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap" style={{ color: '#E6EDF5' }}>
            Hello Khata
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base whitespace-nowrap" style={{ color: '#9DA7B3' }}>
            আপনার ব্যবসার ডিজিটাল খাতা
          </p>
        </div>

        {/* Login Card */}
        <div
          className="px-6 py-6 md:px-10 md:py-8 lg:px-12 lg:py-10 rounded-xl w-full flex flex-col relative"
          style={{
            background: 'linear-gradient(180deg, rgba(35, 46, 60, 1) 0%, rgba(28, 36, 48, 1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)' }} />

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-5 md:gap-6 relative z-10"
              >
                <div className="shrink-0">
                  <h2 className="text-xl md:text-2xl font-semibold whitespace-nowrap" style={{ color: '#E6EDF5' }}>Welcome Back!</h2>
                  <p className="text-sm md:text-base whitespace-nowrap mt-1" style={{ color: '#9DA7B3' }}>Enter your phone number to login</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium whitespace-nowrap shrink-0" style={{ color: '#E6EDF5' }}>Phone Number</label>
                  <div className="relative w-full">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0" style={{ color: '#6B7684' }} />
                    <Input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="pl-12 w-full h-12 md:h-14 text-base"
                      style={{ backgroundColor: '#171F29', borderColor: 'rgba(255, 255, 255, 0.05)', color: '#E6EDF5' }}
                    />
                  </div>
                  <p className="text-xs md:text-sm whitespace-nowrap shrink-0" style={{ color: '#6B7684' }}>We'll send you a 6-digit verification code</p>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loginUser.isPending || phone.length !== 11}
                  className="w-full shrink-0 h-12 md:h-14 font-medium text-base"
                  style={{ background: 'linear-gradient(135deg, #4F5BFF 0%, #5E6AFF 100%)', color: '#FFFFFF', boxShadow: '0 0 20px rgba(79, 91, 255, 0.25)' }}
                >
                  {loginUser.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><span className="whitespace-nowrap">Login</span><ArrowRight className="ml-2 h-5 w-5 shrink-0" /></>)}
                </Button>

                <div className="relative my-2 shrink-0">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}></div></div>
                  <div className="relative flex justify-center text-xs md:text-sm"><span className="px-3 whitespace-nowrap" style={{ color: '#6B7684', background: 'linear-gradient(180deg, rgba(35, 46, 60, 1) 0%, rgba(28, 36, 48, 1) 100%)' }}>or</span></div>
                </div>

                <Link href="/register" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full shrink-0 h-12 md:h-14 font-medium text-base"
                    style={{ backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#E6EDF5' }}
                  >
                    Create New Account
                  </Button>
                </Link>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 md:gap-6 relative z-10"
              >
                <div className="shrink-0">
                  <h2 className="text-xl md:text-2xl font-semibold whitespace-nowrap" style={{ color: '#E6EDF5' }}>Verify OTP</h2>
                  <p className="text-sm md:text-base whitespace-nowrap mt-1" style={{ color: '#9DA7B3' }}>Enter the code sent to {phone}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium whitespace-nowrap shrink-0" style={{ color: '#E6EDF5' }}>Verification Code</label>
                  <div className="relative w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0" style={{ color: '#6B7684' }} />
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-12 text-center tracking-widest w-full h-12 md:h-14 font-mono text-lg md:text-xl"
                      maxLength={6}
                      style={{ backgroundColor: '#171F29', borderColor: 'rgba(255, 255, 255, 0.05)', color: '#E6EDF5' }}
                    />
                  </div>
                </div>

                <p className="text-xs md:text-sm text-center whitespace-nowrap shrink-0" style={{ color: '#6B7684' }}>
                  Demo OTP: <span className="font-mono font-bold" style={{ color: '#0FBF9F' }}>{demoOTP}</span>
                </p>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifyOTP.isPending || otp.length !== 6}
                  className="w-full shrink-0 h-12 md:h-14 font-medium text-base"
                  style={{ background: 'linear-gradient(135deg, #4F5BFF 0%, #5E6AFF 100%)', color: '#FFFFFF', boxShadow: '0 0 20px rgba(79, 91, 255, 0.25)' }}
                >
                  {verifyOTP.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><span className="whitespace-nowrap">Verify OTP</span><CheckCircle2 className="ml-2 h-5 w-5 shrink-0" /></>)}
                </Button>

                <div className="flex items-center justify-between shrink-0">
                  <button onClick={() => setStep('phone')} className="text-sm md:text-base flex items-center gap-1 whitespace-nowrap transition-colors hover:opacity-80" style={{ color: '#9DA7B3' }}>
                    <ArrowLeft className="h-4 w-4 shrink-0" /> Back
                  </button>
                  <button onClick={handleResendOTP} disabled={countdown > 0} className="text-sm md:text-base whitespace-nowrap transition-colors disabled:opacity-50" style={{ color: countdown > 0 ? '#6B7684' : '#4F5BFF' }}>
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs md:text-sm mt-6 whitespace-nowrap" style={{ color: '#6B7684' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}