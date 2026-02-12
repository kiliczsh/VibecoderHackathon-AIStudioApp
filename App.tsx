import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserRole, Task, TaskStatus, User, TaskCategory } from './types';
import { MOCK_USERS, MOCK_TASKS } from './constants';
import TaskCard from './components/TaskCard';
import ImpactDashboard from './components/ImpactDashboard';
import Button from './components/Button';
import VoiceAssistant from './components/VoiceAssistant';
import { analyzeTaskRequest, generateImpactSummary, getTaskLocationContext } from './services/gemini';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[1]); // Default to Elder
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [impactSummary, setImpactSummary] = useState('Generating impact report...');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Voice integration states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [liveTranscription, setLiveTranscription] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter tasks based on current user role for the view
  const filteredTasks = useMemo(() => {
    if (currentUser.role === UserRole.ELDER) {
      // Elders see their own requested tasks
      return tasks.filter(t => t.requesterId === currentUser.id);
    }
    if (currentUser.role === UserRole.TEEN) {
      // Teens see open tasks to pick up, or tasks they have already accepted
      return tasks.filter(t => t.status === TaskStatus.OPEN || t.helperId === currentUser.id);
    }
    // Default fallback or for Admin view (though Admin typically sees dashboard)
    return tasks;
  }, [tasks, currentUser]);

  // Fluid Blob Cursor Logic
  useEffect(() => {
    const blob = document.getElementById('fluid-blob');
    const moveBlob = (e: MouseEvent) => {
      if (blob) {
        blob.style.left = `${e.clientX}px`;
        blob.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', moveBlob);
    return () => window.removeEventListener('mousemove', moveBlob);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await generateImpactSummary(tasks);
      setImpactSummary(summary);
    };
    fetchSummary();
  }, [tasks]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (error) => console.log("Geolocation error:", error));
    }
  }, []);

  const createAIPropelledTask = useCallback(async (description: string) => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    const analysis = await analyzeTaskRequest(description);
    if (analysis) {
      const locationWords = description.split(' ').slice(-5).join(' ');
      const mapsContext = await getTaskLocationContext(locationWords, userLocation?.lat, userLocation?.lng);
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: analysis.title,
        description: analysis.refinedDescription,
        category: analysis.category as TaskCategory,
        requesterId: currentUser.role === UserRole.ELDER ? currentUser.id : 'e1', 
        status: TaskStatus.OPEN,
        creditValue: analysis.suggestedCredits,
        location: mapsContext?.links?.[0]?.title || 'Your Neighborhood',
        createdAt: Date.now()
      };
      setTasks(prev => [newTask, ...prev]);
      setNewTaskInput('');
      setIsNewTaskModalOpen(false);
    }
    setIsAnalyzing(false);
  }, [currentUser, userLocation]);

  useEffect(() => {
    const handleVoiceTask = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.description) {
        await createAIPropelledTask(detail.description);
      }
    };
    const handleTranscription = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.text && isNewTaskModalOpen) {
        setLiveTranscription(detail.text);
        setNewTaskInput(prev => prev.trim() ? prev + " " + detail.text : detail.text);
      }
    };
    const handleStatusChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsVoiceActive(detail.isActive);
      setVoiceStatus(detail.status);
    };
    window.addEventListener('civicbridge:voice-create-task', handleVoiceTask);
    window.addEventListener('civicbridge:voice-input-transcription', handleTranscription);
    window.addEventListener('civicbridge:voice-status-change', handleStatusChange);
    return () => {
      window.removeEventListener('civicbridge:voice-create-task', handleVoiceTask);
      window.removeEventListener('civicbridge:voice-input-transcription', handleTranscription);
      window.removeEventListener('civicbridge:voice-status-change', handleStatusChange);
    };
  }, [createAIPropelledTask, isNewTaskModalOpen]);

  const handleTaskAction = (taskId: string, action: 'accept' | 'complete' | 'verify') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        if (action === 'accept') return { ...task, status: TaskStatus.IN_PROGRESS, helperId: currentUser.id };
        if (action === 'complete') return { ...task, status: TaskStatus.COMPLETED };
        if (action === 'verify') return { ...task, status: TaskStatus.VERIFIED };
      }
      return task;
    }));
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col antialiased selection:bg-leaf selection:text-forest">
      <VoiceAssistant />

      {/* Role Switcher */}
      <div className="bg-forest py-2">
        <div className="max-w-7xl mx-auto px-6 flex justify-center sm:justify-end gap-6">
           {MOCK_USERS.map(user => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all ${
                  currentUser.id === user.id ? 'bg-leaf text-forest' : 'text-leaf/40 hover:text-leaf/80'
                }`}
              >
                {user.role} View
              </button>
            ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-paper/80 backdrop-blur-md px-[5%] py-6 flex justify-between items-center border-b border-black/5">
        <div className="flex items-center gap-2 text-forest font-heading text-2xl font-semibold">
           <svg className="w-8 h-8 text-leaf" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l.395.234 1.127-.403a1 1 0 011.237 1.237l-.403 1.127.234.395H15a1 1 0 110 2h-1.323l-.234.395 1.127 1.127a1 1 0 01-1.237 1.237l-1.127-.403-.395.234V15a1 1 0 11-2 0v-1.323l-.395-.234-1.127.403a1 1 0 01-1.237-1.237l.403-1.127-.234-.395H5a1 1 0 110-2h1.323l.234-.395-1.127-1.127a1 1 0 011.237-1.237l1.127.403.395-.234V3a1 1 0 011-1z" clipRule="evenodd" />
           </svg>
           GenBridge
        </div>
        <div className="hidden md:flex gap-12 text-[11px] font-bold uppercase tracking-widest text-forest">
          <a href="#" className="hover:text-earth">Mission</a>
          <a href="#" className="hover:text-earth">Verification</a>
          <a href="#" className="hover:text-earth">Browse Tasks</a>
        </div>
        <Button variant="primary" size="sm">Connect Now</Button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center px-[10%] overflow-hidden">
        <div className="max-w-[800px] z-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest mb-6 block">Onaylı Sivil Girişim</span>
          <h1 className="text-6xl md:text-8xl font-heading text-forest mb-8 leading-[1.05]">
            Bilgeliği Gönüllü Ellerle Buluşturuyoruz.
          </h1>
          <p className="text-xl md:text-2xl text-brandText/70 max-w-[600px] mb-10 leading-relaxed font-medium">
            Gençlerin toplumsal katkı sağlayarak kazandığı, büyüklerimizin ise güvenilir destek bulduğu belediye onaylı bir topluluk.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg">Join the Bridge</Button>
            <Button variant="outline" size="lg">Browse Tasks</Button>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block pointer-events-none">
          <div className="organic-blob absolute w-[500px] h-[500px] top-[10%] right-[-10%] bg-leaf opacity-40 blur-2xl"></div>
          <div className="organic-blob absolute w-[300px] h-[300px] bottom-[20%] right-[10%] bg-earth opacity-20 blur-3xl delay-1000"></div>
        </div>
      </section>

      {/* Main Content Areas */}
      <section className="bg-sand px-[10%] py-24 rounded-t-[100px] relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-earth mb-2 block">Available Contributions</span>
            <h2 className="text-4xl md:text-5xl font-heading text-forest">Active Tasks</h2>
          </div>
          {currentUser.role === UserRole.ELDER && (
            <Button onClick={() => setIsNewTaskModalOpen(true)} size="lg">New Request</Button>
          )}
        </div>

        {currentUser.role === UserRole.ADMIN ? (
          <ImpactDashboard tasks={tasks} summary={impactSummary} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} userRole={currentUser.role} onAction={handleTaskAction} />
            ))}
          </div>
        )}
      </section>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xl p-4">
          <div className="bg-paper rounded-[60px] w-full max-w-2xl shadow-2xl p-12 relative">
            <button 
              onClick={() => setIsNewTaskModalOpen(false)}
              className="absolute top-8 right-8 text-forest/40 hover:text-forest transition-colors"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-4xl font-heading text-forest mb-8">Post Request</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-lg font-bold text-forest/60">Description</label>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('civicbridge:toggle-voice'))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                    isVoiceActive ? 'bg-earth text-white' : 'bg-sand text-forest'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  {isVoiceActive ? 'Scribing...' : 'Use Voice'}
                </button>
              </div>

              <textarea 
                className="w-full bg-sand/50 rounded-[40px] p-8 text-xl text-forest focus:bg-white border-2 border-transparent focus:border-leaf/30 outline-none h-48 transition-all resize-none shadow-inner"
                placeholder="I need help with..."
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
              />

              <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={() => setIsNewTaskModalOpen(false)}>Cancel</Button>
                <Button isLoading={isAnalyzing} onClick={() => createAIPropelledTask(newTaskInput)}>Post Task</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-paper border-t border-black/5 py-24 px-[10%]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-forest font-heading text-3xl font-semibold mb-6">
               <svg className="w-10 h-10 text-leaf" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M10 2a1 1 0 011 1v1.323l.395.234 1.127-.403a1 1 0 011.237 1.237l-.403 1.127.234.395H15a1 1 0 110 2h-1.323l-.234.395 1.127 1.127a1 1 0 01-1.237 1.237l-1.127-.403-.395.234V15a1 1 0 11-2 0v-1.323l-.395-.234-1.127.403a1 1 0 01-1.237-1.237l.403-1.127-.234-.395H5a1 1 0 110-2h1.323l.234-.395-1.127-1.127a1 1 0 011.237-1.237l1.127.403.395-.234V3a1 1 0 011-1z" />
               </svg>
               GenBridge
            </div>
            <p className="text-forest/60 font-medium">Building bridges across generations through civic action and mutual care.</p>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div className="flex flex-col gap-4 text-forest font-bold text-sm">
              <span className="uppercase tracking-widest text-earth text-[10px]">Community</span>
              <a href="#">Verification</a>
              <a href="#">Safety</a>
            </div>
            <div className="flex flex-col gap-4 text-forest font-bold text-sm">
              <span className="uppercase tracking-widest text-earth text-[10px]">Info</span>
              <a href="#">Privacy</a>
              <a href="#">City Hall</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;