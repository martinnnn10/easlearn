import { useState } from "react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Clock,
  Zap,
  Wrench,
  Monitor,
  Mic,
  ArrowRight,
  Youtube,
  ExternalLink,
} from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail?: string;
  series: string;
  comingSoon?: boolean;
}

const videoSeries = [
  {
    id: "60-second",
    title: "60-Second Fault Fix",
    icon: <Zap className="w-5 h-5" />,
    description:
      "Quick-hit videos showing ONE specific fault diagnosis. Perfect for when you're standing at the drive.",
    format: "30-60 seconds | YouTube Shorts",
  },
  {
    id: "real-faults",
    title: "Real Faults, Real Fixes",
    icon: <Wrench className="w-5 h-5" />,
    description:
      "Longer videos showing actual troubleshooting on real equipment. See the full diagnostic process.",
    format: "5-10 minutes | YouTube",
  },
  {
    id: "simulator",
    title: "Simulator Walkthroughs",
    icon: <Monitor className="w-5 h-5" />,
    description:
      "Screen recordings of someone completing a simulator scenario with branching decisions and scoring.",
    format: "3-5 minutes | YouTube",
  },
  {
    id: "tech-talk",
    title: "Tech Talk",
    icon: <Mic className="w-5 h-5" />,
    description:
      "Interviews with experienced maintenance techs. Career advice, war stories, and tips for new techs.",
    format: "15-20 minutes | Podcast-style",
  },
];

const videos: VideoItem[] = [
  {
    id: "1",
    title: "PowerFlex F004 — Check THIS First",
    description:
      "When you see an F004 UnderVoltage fault, here's the first thing to check before you do anything else.",
    duration: "0:45",
    series: "60-second",
    comingSoon: true,
  },
  {
    id: "2",
    title: "F002 Overcurrent — Is It the Motor or the Drive?",
    description:
      "Quick test to determine if your overcurrent fault is caused by a motor issue or a failed IGBT in the drive.",
    duration: "0:55",
    series: "60-second",
    comingSoon: true,
  },
  {
    id: "3",
    title: "PLC Module LED Red — What It Actually Means",
    description:
      "That red LED doesn't always mean the module is dead. Here's how to read it correctly.",
    duration: "0:40",
    series: "60-second",
    comingSoon: true,
  },
  {
    id: "4",
    title: "Motor Overload Keeps Tripping — Here's What I Found",
    description:
      "A real case where a motor overload kept tripping intermittently. The root cause wasn't what anyone expected.",
    duration: "7:30",
    series: "real-faults",
    comingSoon: true,
  },
  {
    id: "5",
    title: "VFD Replacement Gone Wrong — Parameter Upload Failure",
    description:
      "What happens when you upload parameters to a replacement drive and it still won't run. Full troubleshooting walkthrough.",
    duration: "9:15",
    series: "real-faults",
    comingSoon: true,
  },
  {
    id: "6",
    title: "Conveyor Line Down — Tracing the Safety Circuit",
    description:
      "A production line went down with no alarms displayed. Watch how we traced it to an intermittent safety gate switch.",
    duration: "8:45",
    series: "real-faults",
    comingSoon: true,
  },
  {
    id: "7",
    title: "Simulator: VFD Trips During Ramp-Up",
    description:
      "Watch a complete walkthrough of the VFD overcurrent scenario with all branching decisions explained.",
    duration: "4:20",
    series: "simulator",
    comingSoon: true,
  },
  {
    id: "8",
    title: "Simulator: PLC Major Fault Recovery",
    description:
      "Step-by-step walkthrough of recovering from a ControlLogix major fault in the simulator.",
    duration: "3:50",
    series: "simulator",
    comingSoon: true,
  },
  {
    id: "9",
    title: "From Apprentice to Lead Tech in 5 Years — Career Path",
    description:
      "Interview with a lead maintenance tech who went from zero experience to running a team at a food manufacturing plant.",
    duration: "18:30",
    series: "tech-talk",
    comingSoon: true,
  },
  {
    id: "10",
    title: "The Worst Fault I've Ever Seen — Stories from the Floor",
    description:
      "Three experienced techs share their most challenging troubleshooting stories and what they learned.",
    duration: "22:15",
    series: "tech-talk",
    comingSoon: true,
  },
];

export default function Videos() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredVideos =
    activeTab === "all"
      ? videos
      : videos.filter((v) => v.series === activeTab);

  return (
    <>
      <SEO
        title="Video Training Library"
        description="Watch free industrial troubleshooting videos. Quick fault fixes, real equipment diagnostics, simulator walkthroughs, and tech career advice."
        path="/videos"
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                <Play className="w-3.5 h-3.5 mr-1" />
                Video Training
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Video Training Library
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Watch real troubleshooting on real equipment. From 60-second fault
                fixes to full diagnostic walkthroughs — all free on YouTube.
              </p>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://youtube.com/@EASPlatform"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="w-5 h-5 mr-2 text-red-500" />
                  Subscribe on YouTube
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Series Overview */}
        <section className="py-12 border-b border-border/50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {videoSeries.map((series) => (
                <Card
                  key={series.id}
                  className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => setActiveTab(series.id)}
                >
                  <CardContent className="p-5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-3">
                      {series.icon}
                    </div>
                    <h3 className="font-bold mb-1">{series.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {series.description}
                    </p>
                    <p className="text-xs text-primary">{series.format}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Video Grid */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="max-w-6xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-8">
                  <TabsTrigger value="all">All Videos</TabsTrigger>
                  {videoSeries.map((s) => (
                    <TabsTrigger key={s.id} value={s.id}>
                      {s.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={activeTab}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                      <Card
                        key={video.id}
                        className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors group"
                      >
                        {/* Thumbnail placeholder */}
                        <div className="relative aspect-video bg-muted/50 flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <Play className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                          {video.comingSoon && (
                            <Badge
                              variant="secondary"
                              className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 border-amber-500/30"
                            >
                              Coming Soon
                            </Badge>
                          )}
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {videoSeries.find((s) => s.id === video.series)
                              ?.title || ""}
                          </Badge>
                          <h3 className="font-bold text-sm mb-1 line-clamp-2">
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Coming Soon Notice */}
              <div className="mt-12 text-center">
                <Card className="bg-muted/30 border-border/50 max-w-2xl mx-auto">
                  <CardContent className="p-8">
                    <Youtube className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      Videos Coming Soon
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      We're filming real troubleshooting content on actual plant
                      equipment. Subscribe to our YouTube channel to be notified
                      when new videos drop.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button asChild>
                        <a
                          href="https://youtube.com/@EASPlatform"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Youtube className="w-4 h-4 mr-2" />
                          Subscribe
                        </a>
                      </Button>
                      <Link href="/simulator">
                        <Button variant="outline">
                          Try the Simulator Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
