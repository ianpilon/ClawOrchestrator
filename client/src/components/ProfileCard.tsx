import { motion } from 'framer-motion';
import { NodeData } from '@/lib/mockData';
import { Github, Linkedin, Twitter, Globe, X, ExternalLink, Briefcase, MapPin, Clock, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProfileCardProps {
  node: NodeData | null;
  onClose: () => void;
}

export function ProfileCard({ node, onClose }: ProfileCardProps) {
  if (!node) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed right-4 top-4 bottom-4 w-[400px] z-50 pointer-events-auto"
    >
      <Card className="h-full bg-black/80 backdrop-blur-xl border-primary/20 text-white shadow-2xl overflow-y-auto scrollbar-hide">
        <CardHeader className="relative p-0 h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="absolute -bottom-12 left-6">
            <div className={`rounded-full p-1 ${node.exceptional ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-border'}`}>
              <img
                src={node.img}
                alt={node.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-black"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-16 px-6 pb-6 space-y-6">
          {/* Header Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-display">{node.name}</h2>
              {node.exceptional && (
                <Badge variant="outline" className="border-primary text-primary bg-primary/10 animate-pulse">
                  Exceptional
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Briefcase className="w-3 h-3" />
              {node.role} at <span className="text-foreground font-medium">{node.company}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
               <MapPin className="w-3 h-3" /> {node.location} 
               <span className="mx-1">•</span>
               <Clock className="w-3 h-3" /> {node.yearsExperience}y exp
            </p>
          </div>

          <Separator className="bg-white/10" />

          {/* Psychographic Profile */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Psychographic Profile</h3>
            
            <div className="grid grid-cols-2 gap-4">
               <TraitBar label="Innovation" value={node.psychographic.innovationScore} color="bg-primary" />
               <TraitBar label="Leadership" value={node.psychographic.leadershipPotential} color="bg-secondary" />
               <TraitBar label="Openness" value={node.psychographic.openness} color="bg-blue-500" />
               <TraitBar label="Conscientiousness" value={node.psychographic.conscientiousness} color="bg-green-500" />
            </div>
          </div>

           {/* Skills */}
           <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Skills</h3>
            <div className="flex flex-wrap gap-2">
              {node.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-white/80 border-0">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Connect</h3>
            <div className="grid grid-cols-2 gap-2">
               <SocialBtn icon={Github} label="Github" href={`https://${node.social.github}`} />
               <SocialBtn icon={Linkedin} label="LinkedIn" href={`https://${node.social.linkedin}`} />
               <SocialBtn icon={Twitter} label="Twitter" href={`https://${node.social.twitter}`} />
               <SocialBtn icon={Globe} label="Website" href={`https://${node.social.website}`} />
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}

function TraitBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white/90">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SocialBtn({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Button variant="outline" className="w-full justify-start gap-2 border-white/10 hover:bg-white/5 hover:text-white" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Icon className="w-4 h-4" />
        {label}
      </a>
    </Button>
  );
}
