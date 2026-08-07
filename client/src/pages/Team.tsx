import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, Copy, Trash2, Mail, Shield, Crown, Loader2, CheckCircle2, BarChart3, UserCheck, Target, RefreshCw, XCircle, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";

function ManageSeatsButton() {
  const createPortal = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Opening billing portal...");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to open billing portal");
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => createPortal.mutate()}
      disabled={createPortal.isPending}
      className="border-zinc-700 text-zinc-300 hover:border-green-700 hover:text-green-400 shrink-0"
    >
      {createPortal.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : null}
      Manage Seats
    </Button>
  );
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "text-yellow-500",
  admin: "text-purple-400",
  manager: "text-blue-400",
  member: "text-green-400",
};

export default function Team() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const teamQuery = trpc.team.getMyTeam.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createInvite = trpc.team.createInvite.useMutation({
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/team/invite/${data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(data.token);
      const emailMsg = data.emailSent
        ? `Invite email sent to ${inviteEmail} and link copied to clipboard.`
        : `Link copied to clipboard. Email delivery may be delayed — share the link manually.`;
      toast.success(emailMsg);
      setInviteEmail("");
      setInviteRole("member");
      teamQuery.refetch();
      setTimeout(() => setCopiedToken(null), 3000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from team");
      teamQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const changeRole = trpc.team.changeRole.useMutation({
    onSuccess: (data) => {
      toast.success(`Role changed from ${data.previousRole} to the new role`);
      teamQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resendInvite = trpc.team.resendInvite.useMutation({
    onSuccess: (data) => {
      const msg = data.emailSent
        ? "Invite resent! Email delivered."
        : "New invite link generated. Email delivery may be delayed.";
      toast.success(msg);
      teamQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const cancelInvite = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite canceled");
      teamQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-white">Team Dashboard</CardTitle>
            <CardDescription>Sign in to manage your team</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => window.location.href = "/login"}
              className="bg-green-700 hover:bg-green-600"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const team = teamQuery.data;

  if (teamQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  // No team yet - show upgrade prompt
  if (!team) {
    return (
      <>
        <SEO title="Team Dashboard | EAS" description="Manage your training team" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-lg w-full bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center">
              <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-white">No Team Found</CardTitle>
              <CardDescription className="text-zinc-400 text-base mt-2">
                You don't have a team yet. Subscribe to the Team plan to create a team and invite your maintenance technicians.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => window.location.href = "/pricing"}
                className="bg-green-700 hover:bg-green-600"
              >
                View Team Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const activeMembers = team.members.filter((m: any) => m.status === "active");
  const pendingMembers = team.members.filter((m: any) => m.status === "pending");
  const isOwner = team.role === "owner";
  const isAdmin = team.role === "admin" || isOwner;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    createInvite.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleCopyInviteLink = (token: string) => {
    const url = `${window.location.origin}/team/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success("Invite link copied!");
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <>
      <SEO title="Team Dashboard | EAS" description="Manage your training team" />
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white font-['Oswald']">{team.name}</h1>
              <p className="text-zinc-400 mt-1">
                {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""} · {team.maxSeats} seats total
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <>
                  <Link href="/manager">
                    <Button variant="outline" size="sm" className="border-green-700 text-green-400 hover:bg-green-900/30">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Manager Portal
                    </Button>
                  </Link>
                  <Link href="/hire-ready">
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:border-green-700 hover:text-green-400">
                      <UserCheck className="w-4 h-4 mr-2" />
                      HireReady™
                    </Button>
                  </Link>
                  <Link href="/team/skills">
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:border-green-700 hover:text-green-400">
                      <Target className="w-4 h-4 mr-2" />
                      Skill Matrix
                    </Button>
                  </Link>
                  <Link href="/team/progress">
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:border-green-700 hover:text-green-400">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Progress
                    </Button>
                  </Link>
                </>
              )}
              <Badge variant="outline" className="border-green-700 text-green-400 w-fit">
                <Shield className="w-3 h-3 mr-1" />
                {ROLE_LABELS[team.role] || team.role}
              </Badge>
            </div>
          </div>

          {/* Seat Management */}
          {isOwner && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-400">Need to add or remove seats?</p>
                    <p className="text-xs text-zinc-500 mt-1">Manage your subscription through the Stripe billing portal to adjust seat count.</p>
                  </div>
                  <ManageSeatsButton />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{activeMembers.length}</p>
                    <p className="text-sm text-zinc-400">Active Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-900/30 rounded-lg">
                    <Mail className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{pendingMembers.length}</p>
                    <p className="text-sm text-zinc-400">Pending Invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{team.maxSeats - activeMembers.length - pendingMembers.length}</p>
                    <p className="text-sm text-zinc-400">Available Seats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invite Section (Owner or Admin) */}
          {isAdmin && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-500" />
                  Invite Team Members
                </CardTitle>
                <CardDescription>
                  Send an invite link to your technicians. They'll receive an email with the link and get access through your team subscription.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="technician@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    disabled={createInvite.isPending || !inviteEmail.trim()}
                    className="bg-green-700 hover:bg-green-600"
                  >
                    {createInvite.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                      </>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-zinc-500 mt-2">
                  <strong>Member:</strong> Learner access · <strong>Manager:</strong> Can view team readiness · <strong>Admin:</strong> Can invite and manage members
                </p>
              </CardContent>
            </Card>
          )}

          {/* Active Members */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Active Members</CardTitle>
              <CardDescription>Team members with full training access</CardDescription>
            </CardHeader>
            <CardContent>
              {activeMembers.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No active members yet. Send invites above.</p>
              ) : (
                <div className="space-y-3">
                  {activeMembers.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center">
                          {member.role === "owner" ? (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          ) : member.role === "admin" ? (
                            <Shield className="w-5 h-5 text-purple-400" />
                          ) : member.role === "manager" ? (
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Users className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {member.invitedEmail || "Team Owner"}
                          </p>
                          <p className="text-sm text-zinc-400">
                            <span className={ROLE_COLORS[member.role] || "text-zinc-400"}>{ROLE_LABELS[member.role] || member.role}</span>
                            {" · Joined "}
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Role change (owner only, not for self or other owners) */}
                        {isOwner && member.role !== "owner" && (
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => {
                              if (newRole !== member.role) {
                                changeRole.mutate({ memberId: member.id, newRole: newRole as any });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[110px] h-8 bg-zinc-800 border-zinc-700 text-xs text-zinc-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {isOwner && member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember.mutate({ memberId: member.id })}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invites */}
          {pendingMembers.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Pending Invites</CardTitle>
                <CardDescription>Waiting for team members to accept</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingMembers.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-900/30 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.invitedEmail}</p>
                          <p className="text-sm text-zinc-400">
                            Invited as <span className={ROLE_COLORS[member.invitedRole || "member"]}>{ROLE_LABELS[member.invitedRole || "member"]}</span>
                            {" · "}
                            {new Date(member.createdAt).toLocaleDateString()}
                            {member.expiresAt && (
                              <span className="text-zinc-500">
                                {" · Expires "}
                                {new Date(member.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {member.inviteToken && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteLink(member.inviteToken)}
                            className="text-zinc-400 hover:text-white"
                            title="Copy invite link"
                          >
                            {copiedToken === member.inviteToken ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendInvite.mutate({ memberId: member.id })}
                              disabled={resendInvite.isPending}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              title="Resend invite email"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvite.mutate({ memberId: member.id })}
                              disabled={cancelInvite.isPending}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              title="Cancel invite"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
