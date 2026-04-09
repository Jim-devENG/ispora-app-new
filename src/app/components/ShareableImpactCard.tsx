import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { ImpactCardData } from '../types';
import { Download, Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShareableImpactCardProps {
  data: ImpactCardData;
  role: 'diaspora' | 'student';
}

export function ShareableImpactCard({ data, role }: ShareableImpactCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    // For now, we'll just copy the text version
    // In a real implementation, you would use html2canvas or similar
    const text = generateTextVersion();
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Impact card text copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy impact card');
    }
  };

  const handleShare = async () => {
    const text = generateShareText();
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: role === 'diaspora' ? 'My Ispora Impact' : 'My Ispora Journey',
          text: text,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast.success('Share text copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy share text');
      }
    }
  };

  const generateTextVersion = () => {
    const activeSinceDate = data.activeSince ? new Date(data.activeSince).getFullYear() : '';
    
    if (role === 'diaspora') {
      return `🌟 MY ISPORA IMPACT 🌟

${data.name}
${data.title}${data.company ? ` at ${data.company}` : ''}

${data.stats.map(s => `✓ ${s.value} ${s.label}`).join('\n')}

"${data.quote}"

Active since ${activeSinceDate}

🔗 Join me at ispora.com`;
    } else {
      return `🎉 MY ISPORA JOURNEY 🎉

${data.name}
${data.title}${data.university ? ` | ${data.university}` : ''}

${data.stats.map(s => `✓ ${s.value} ${s.label}`).join('\n')}

"${data.quote}"

Learning since ${activeSinceDate}

🔗 Start your journey at ispora.com`;
    }
  };

  const generateShareText = () => {
    if (role === 'diaspora') {
      const sessionStat = data.stats.find(s => s.label === 'Sessions Completed');
      const youthStat = data.stats.find(s => s.label === 'Youths Mentored');
      
      return `Just reviewed my impact on Ispora! 🌟\n\n✓ ${youthStat?.value || 0} youths mentored\n✓ ${sessionStat?.value || 0} sessions completed\n\nProud to be empowering Nigeria's next generation of professionals.`;
    } else {
      const sessionStat = data.stats.find(s => s.label === 'Sessions Attended');
      const mentorStat = data.stats.find(s => s.label === 'Mentors Connected');
      
      return `Celebrating my learning journey on Ispora! 🎉\n\n✓ ${sessionStat?.value || 0} sessions attended\n✓ ${mentorStat?.value || 0} mentors guiding me\n\nBuilding my future, one session at a time.`;
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Share Your {role === 'diaspora' ? 'Impact' : 'Journey'}</CardTitle>
          <CardDescription>
            Show others the difference {role === 'diaspora' ? "you're making" : "you're experiencing"} and inspire them to join Ispora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Card Preview */}
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-8 text-white shadow-xl"
          >
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">
                🌟 MY {role === 'diaspora' ? 'ISPORA IMPACT' : 'ISPORA JOURNEY'} 🌟
              </div>
              
              <div className="space-y-1">
                <p className="text-xl font-bold">{data.name}</p>
                <p className="text-sm opacity-90">{data.title}</p>
                {(data.company || data.university) && (
                  <p className="text-sm opacity-75">{data.company || data.university}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-6">
                {data.stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs opacity-90 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="italic text-sm border-t border-white/20 pt-4">
                "{data.quote}"
              </div>

              <div className="flex items-center justify-center gap-2 text-sm opacity-75 pt-2">
                <span>🔗 Join me at ispora.com</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Copy Text
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 sm:flex-none">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleCopyLink} variant="outline" className="flex-1 sm:flex-none">
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>

          {/* Social Media Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold mb-2">💡 Sharing Tips</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Share on LinkedIn to inspire your professional network</li>
                <li>• Post on Twitter/X to reach a wider audience</li>
                <li>• Share in WhatsApp groups to encourage others to join</li>
                <li>• Tag @Ispora to be featured on our community page</li>
              </ul>
            </CardContent>
          </Card>

          {/* Pre-filled Share Text Preview */}
          <div>
            <p className="text-sm font-semibold mb-2">Share Text Preview:</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-line border">
              {generateShareText()}
              <div className="mt-2 text-blue-600">
                {window.location.origin}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
