import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import ProfileApprovalCard from './ProfileApprovalCard'
import ApplicationCard from './ApplicationCard'

export default async function AdminApplicationsPage() {
  const supabase = await createClient()

  const [{ data: pendingProfiles }, { data: applications }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const pendingApps = (applications || []).filter(a => a.status === 'pending')
  const reviewedApps = (applications || []).filter(a => a.status !== 'pending')

  const totalPending = (pendingProfiles?.length ?? 0) + pendingApps.length

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline gap-3 mb-8">
        <h1 className="text-2xl font-bold">Applications</h1>
        {totalPending > 0 && (
          <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            {totalPending} pending
          </span>
        )}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/50">
            Pending {totalPending > 0 && `(${totalPending})`}
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/50">
            Reviewed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Pending profiles (signed up via invite but await approval, or direct signup) */}
          {(pendingProfiles || []).map(profile => (
            <ProfileApprovalCard key={profile.id} profile={profile} />
          ))}

          {/* Pending applications (applied via form, haven't signed up yet) */}
          {pendingApps.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))}

          {totalPending === 0 && (
            <p className="text-white/30 text-sm text-center py-16">No pending reviews. All clear.</p>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-2">
          {reviewedApps.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-16">No reviewed applications yet.</p>
          ) : (
            reviewedApps.map(app => (
              <div key={app.id} className="border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{app.full_name}</span>
                  <span className="text-white/30 text-xs ml-3">{app.email}</span>
                </div>
                <Badge variant="outline" className={`text-xs border ${
                  app.status === 'approved' ? 'border-green-500/30 text-green-400' :
                  app.status === 'rejected' ? 'border-red-500/30 text-red-400' :
                  'border-blue-500/30 text-blue-400'
                }`}>
                  {app.status}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
