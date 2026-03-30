'use client'
import VoiceModal from '@/components/ai/VoiceModal'
import CommandPalette from '@/components/common/CommandPalette'
import { useState, useEffect, useSyncExternalStore } from 'react';
import { AppLayout } from '@/components/layout';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore } from '@/stores/uiStore';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { LoginPage } from '@/components/auth/LoginPage';
import client from '@/lib/axios';
import { useRouter } from 'next/navigation';

// Simple store subscription for hydration
const emptySubscribe = () => () => {};

const DashboardLayout  = ({children})=> {
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);
     const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
   
     // Proper hydration detection using useSyncExternalStore
     const mounted = useSyncExternalStore(
       emptySubscribe,
       () => true,
       () => false
     );
   
     // Get state from stores after mount
     const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
     const toggleAiDrawer = useUiStore((state) => state.toggleAiDrawer);
     const currentPage = useUiStore((state) => state.currentPage);
     
     const router = useRouter()
     // Listen for command palette open event
     useEffect(() => {
       const handleOpenCommandPalette = () => setCommandPaletteOpen(true);
       const handleOpenVoiceModal = () => setVoiceModalOpen(true);
   
       window.addEventListener('openCommandPalette', handleOpenCommandPalette);
       window.addEventListener('openVoiceModal', handleOpenVoiceModal);
       return () => {
         window.removeEventListener('openCommandPalette', handleOpenCommandPalette);
         window.removeEventListener('openVoiceModal', handleOpenVoiceModal);
       };
     }, []);
   
     // Keyboard shortcuts
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.ctrlKey && e.key === '\\') {
           e.preventDefault();
           toggleAiDrawer();
         }
         if (e.ctrlKey && e.key === 'm') {
           e.preventDefault();
           setVoiceModalOpen(true);
         }
       };
   
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [toggleAiDrawer]);
   

//      useEffect(()=>{
//      client.get('https://voiceerp.mapleitfirm.com/api/auth/status')
//      .then(res => console.log(res))
//       .then(data => console.log(data))
// },[])
     // Loading state - show while hydrating
     if (!mounted) {
       return (
         <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#0F141B' }}>
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex flex-col items-center gap-4"
           >
             <div 
               className="h-12 w-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #4F5BFF 0%, #6366F1 50%, #0FBF9F 100%)' }}
             >
               <Sparkles className="h-6 w-6 text-white animate-pulse" />
             </div>
             <p style={{ color: '#9DA7B3' }} className="text-sm">Loading Hello Khata...</p>
           </motion.div>
         </div>
       );
     }
   
     // Show login page if not authenticated
     if (!isAuthenticated) {
       return router.push('/login')
     }
   
  return (
    <>
       <AppLayout>
            {children}
            </AppLayout>
      
            {/* Voice Modal */}
            <VoiceModal
              isOpen={voiceModalOpen}
              onClose={() => setVoiceModalOpen(false)}
            />
      
            {/* Command Palette */}
            <CommandPalette
              isOpen={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
            />
    </>
  )
}

export default DashboardLayout
