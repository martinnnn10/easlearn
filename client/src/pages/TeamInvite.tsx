import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import SEO from "@/components/SEO";

export default function TeamInvite() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const token = params.token || "";

  const inviteInfo = trpc.team.getInviteInfo.useQuery(
    { token },
    { enabled: !!token }
  );

  const acceptInvite = trpc.team.acceptInvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome to ${data.teamName}!`, {
        description: "You now have full training access through your team.",
      });
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (authLoading || inviteInfo.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Invalid or expired invite
  if (!inviteInfo.data) {
    return (
      <>
        <SEO title="Invalid Invite | EAS" description="This invite link is invalid or expired" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <CardTitle className="text-white">Invalid Invite</CardTitle>
              <CardDescription>
                This invite link is invalid or has already been used. Ask your team manager for a new invite.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  // Not logged in - prompt login
  if (!isAuthenticated) {
    return (
      <>
        <SEO title="Join Team | EAS" description={`Join ${inviteInfo.data.teamName} on EAS`} />
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <CardTitle className="text-white">Join {inviteInfo.data.teamName}</CardTitle>
              <CardDescription>
                You've been invited to join <strong className="text-white">{inviteInfo.data.teamName}</strong> on EAS Training. Sign in or create an account to accept.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => window.location.href = "/login"}
                className="bg-green-700 hover:bg-green-600"
              >
                Sign In to Accept Invite
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Logged in - show accept button
  return (
    <>
      <SEO title="Join Team | EAS" description={`Join ${inviteInfo.data.teamName} on EAS`} />
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-white">Join {inviteInfo.data.teamName}</CardTitle>
            <CardDescription>
              You've been invited to join this team. Accepting will give you full access to all training courses, the simulator, and quizzes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-400">Signed in as</p>
              <p className="text-white font-medium">{user?.name || user?.email}</p>
            </div>
            <Button
              onClick={() => acceptInvite.mutate({ token })}
              disabled={acceptInvite.isPending || acceptInvite.isSuccess}
              className="w-full bg-green-700 hover:bg-green-600"
            >
              {acceptInvite.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : acceptInvite.isSuccess ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              {acceptInvite.isSuccess ? "Joined!" : "Accept Invite & Join Team"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
