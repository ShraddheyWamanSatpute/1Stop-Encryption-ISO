import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/auth-validation";
import { logPasswordResetSuccess, logPasswordResetFailure } from "@/lib/auth-logger";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  useEffect(() => {
    const verifyResetCode = async () => {
      if (!oobCode || mode !== "resetPassword") {
        setError("Invalid or missing reset code. Please request a new password reset.");
        setLoading(false);
        return;
      }

      try {
        // Verify the password reset code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setLoading(false);
      } catch (error: any) {
        console.error("Error verifying reset code:", error);
        let errorMessage = "Invalid or expired reset code.";
        
        switch (error.code) {
          case "auth/expired-action-code":
            errorMessage = "This reset link has expired. Please request a new password reset.";
            break;
          case "auth/invalid-action-code":
            errorMessage = "This reset link is invalid. Please request a new password reset.";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled. Please contact support.";
            break;
          case "auth/user-not-found":
            errorMessage = "No account found with this email address.";
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    verifyResetCode();
  }, [oobCode, mode]);

  const validateForm = () => {
    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (!formData.confirmPassword) {
      setError("Please confirm your password");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.success) {
      setError(passwordValidation.error.errors[0]?.message || "Invalid password");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    if (!oobCode) {
      setError("Missing reset code. Please request a new password reset.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Confirm the password reset with the new password
      await confirmPasswordReset(auth, oobCode, formData.password);
      
      logPasswordResetSuccess(email);
      
      setSuccess(true);
      
      toast({
        title: "Password reset successful!",
        description: "Your password has been updated. You can now sign in with your new password.",
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/auth?tab=login");
      }, 2000);

    } catch (error: any) {
      console.error("Error resetting password:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      
      switch (error.code) {
        case "auth/expired-action-code":
          errorMessage = "This reset link has expired. Please request a new password reset.";
          break;
        case "auth/invalid-action-code":
          errorMessage = "This reset link is invalid. Please request a new password reset.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
      }
      
      logPasswordResetFailure(email, error.code);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    
    strength = checks.filter(Boolean).length;
    
    if (strength < 3) return { level: "weak", color: "text-red-500", bg: "bg-red-100" };
    if (strength < 5) return { level: "medium", color: "text-yellow-500", bg: "bg-yellow-100" };
    return { level: "strong", color: "text-green-500", bg: "bg-green-100" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-gray-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/auth?tab=reset")} 
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Password Reset Successful!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your password has been updated successfully. Redirecting to sign in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your new password for {email}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              
              {formData.password && (
                <div className="space-y-2">
                  <div className={`text-xs px-2 py-1 rounded ${passwordStrength.bg} ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.level}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li className={formData.password.length >= 8 ? "text-green-600" : "text-gray-400"}>
                        At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : "text-gray-400"}>
                        One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? "text-green-600" : "text-gray-400"}>
                        One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? "text-green-600" : "text-gray-400"}>
                        One number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : "text-gray-400"}>
                        One special character
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 pr-10"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600">Passwords match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !formData.password || !formData.confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/auth?tab=login")}
              disabled={isSubmitting}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
