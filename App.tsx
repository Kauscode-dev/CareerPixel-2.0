
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Upload, 
  Target, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  Map, 
  ListTodo,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  User,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Zap,
  Search,
  MessageSquare,
  X,
  Send,
  Briefcase,
  MapPin,
  Building2,
  Globe,
  Fingerprint,
  Bot,
  Mail,
  Crosshair,
  ArrowRight,
  Cpu,
  MessageSquareX
} from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { CircularProgress } from './components/ProgressBar';
import { MultiSelect } from './components/MultiSelect';
import { 
  analyzeCareer, 
  quickPolishAspirations, 
  getMarketInsights, 
  createChatSession,
  generateCustomRoadmap
} from './services/geminiService';
import { extractTextFromPDF } from './services/pdfService';
import { CareerPixelResponse, ViewState, ChatMessage, ImageSize, UserPreferences, BestFitRole } from './types';

function App() {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [resumeText, setResumeText] = useState('');
  const [aspirations, setAspirations] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<CareerPixelResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'PERSONA' | 'ATS' | 'MAP' | 'ROADMAP'>('PERSONA');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  // User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    targetRole: [],
    targetIndustry: [],
    targetCompanyType: [],
    targetLocation: []
  });

  // Feature States
  const [isPolishing, setIsPolishing] = useState(false);
  const [marketInsights, setMarketInsights] = useState<string | null>(null);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  
  // Roadmap States
  const [roadmapDuration, setRoadmapDuration] = useState(4); // weeks
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [customRoadmap, setCustomRoadmap] = useState<any[] | null>(null);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState<any>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Constants for Dropdowns
  const JOB_FUNCTIONS = ["Product Management", "Engineering", "Data Science", "Sales/GTM", "Marketing", "Design", "Operations", "Finance", "HR", "Strategy", "Customer Success", "Legal", "General Management"];
  const INDUSTRIES = ["Fintech", "Edtech", "Healthtech", "E-commerce", "SaaS", "AI/ML", "Consumer Social", "Logistics", "Real Estate", "Cyber Security", "Media/Entertainment"];
  const COMPANY_TYPES = ["Early-stage Startup", "Growth-stage Startup", "Unicorn", "MNC", "Enterprise", "FAANG", "Consulting Firm", "Investment Bank"];
  const LOCATIONS = ["Bangalore", "Gurgaon", "Mumbai", "Hyderabad", "Pune", "Delhi NCR", "Chennai", "Noida", "Remote (India)", "Remote (Global)"];

  const ARCHETYPE_TRAITS: Record<string, string[]> = {
    "The Builder": ["Autonomous", "Execution-Oriented", "Zero-to-One Mindset"],
    "The Strategist": ["Systems Thinking", "Long-Term Vision", "Pattern Recognition"],
    "The Creator": ["Innovative", "Storytelling", "Originality"],
    "The Operator": ["Efficiency", "Process-Driven", "Reliability"],
    "The Analyst": ["Data-Driven", "Logical", "Precision"],
    "The Communicator": ["Empathetic", "Persuasive", "Articulate"],
    "The Visionary": ["Future-Focused", "Risk-Taking", "Inspirational"],
    "Explorer": ["Curious", "Adaptable", "Multidisciplinary"]
  };

  // Initialize Chat Session on Load
  useEffect(() => {
    try {
      if (process.env.API_KEY) {
        setChatSession(createChatSession());
      }
    } catch (e) {
      console.error("Chat init failed", e);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    
    setView(ViewState.PROCESSING);
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 1500);

    try {
      const result = await analyzeCareer(resumeText, aspirations, preferences);
      setData(result);
      clearInterval(interval);
      setView(ViewState.DASHBOARD);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || "Failed to analyze resume. Check API Key.");
      setView(ViewState.ERROR);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFileName(file.name);

    if (file.type === 'application/pdf') {
      setIsParsingPdf(true);
      try {
        const text = await extractTextFromPDF(file);
        setResumeText(text);
      } catch (error) {
        console.error("PDF Parse Error", error);
        alert("Failed to parse PDF. Please try copying text manually.");
      } finally {
        setIsParsingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text);
      };
      reader.readAsText(file);
    }
  };

  // --- Feature Handlers ---

  const handlePolish = async () => {
    if (!aspirations.trim()) return;
    setIsPolishing(true);
    try {
      const polished = await quickPolishAspirations(aspirations);
      setAspirations(polished);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleMarketInsights = async () => {
    if (!data?.career_map?.best_fit_roles?.[0]?.role || !data?.parsed_data?.location) return;
    setIsLoadingMarket(true);
    try {
      const insights = await getMarketInsights(data.career_map.best_fit_roles[0].role, data.parsed_data.location);
      setMarketInsights(insights);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMarket(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!data) return;
    setIsGeneratingRoadmap(true);
    try {
      const roadmap = await generateCustomRoadmap(
        data.user_persona.psych_profile,
        data.career_map.best_fit_roles?.[0]?.role || "General",
        roadmapDuration
      );
      setCustomRoadmap(roadmap);
    } catch (e) {
      console.error(e);
      alert("Roadmap generation failed.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatSession) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg.text });
      const modelMsg: ChatMessage = { role: 'model', text: result.text || "I couldn't generate a response.", timestamp: Date.now() };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error("Chat Error", e);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now.", timestamp: Date.now() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Background ---
  
  const SpaceBackground = () => (
    <div className="space-particles">
       {Array.from({ length: 30 }).map((_, i) => (
         <div 
           key={i} 
           className="star opacity-30" 
           style={{
             left: `${Math.random() * 100}%`,
             top: `${Math.random() * 100}%`,
             animationDuration: `${Math.random() * 5 + 3}s`,
             animationDelay: `${Math.random() * 5}s`
           }} 
         />
       ))}
    </div>
  );

  // --- Views ---

  const renderLanding = () => (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-6">
      <SpaceBackground />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto text-center relative z-10 space-y-10"
      >
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wide backdrop-blur-sm hover:bg-white/10 transition-colors"
        >
          <Sparkles size={12} className="text-[#FFD700]" />
          <span className="text-gray-300">AI-Powered Career Intelligence v2.5</span>
        </motion.div>
        
        {/* Main Heading */}
        <div className="relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute -top-12 left-0 right-0 h-32 bg-gradient-to-r from-transparent via-[#00E3FF]/10 to-transparent blur-3xl -z-10"
          ></motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-tight"
          >
            <span className="block text-white mb-2">
              Career
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">Pixel</span>
            </span>
          </motion.h1>
        </div>
        
        {/* Subheading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {/* Top Gradient Line */}
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          
          <p className="text-3xl md:text-5xl font-medium text-white leading-tight">
            Stop applying to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">hundreds</span> of jobs.
          </p>
          
          {/* Bottom Gradient Line */}
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#00E3FF]/50 to-transparent"></div>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Your AI career agent that finds roles you'll actually thrive in, 
            then helps you execute personalized outreach that gets responses.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Button 
            onClick={() => setView(ViewState.INPUT)} 
            className="w-full sm:w-auto text-base px-8 py-4 bg-white text-black hover:bg-gray-200 border-none shadow-lg shadow-white/10"
          >
            Get Started <ArrowRight size={18} />
          </Button>
          
          <Button 
            variant="glass"
            className="w-full sm:w-auto text-base px-8 py-4"
          >
            See How It Works
          </Button>
        </motion.div>

        {/* Feature Pills - No Emojis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-8"
        >
          {[
            { icon: Brain, text: "Psychometric Analysis" },
            { icon: Crosshair, text: "Precision Matching" },
            { icon: Zap, text: "Automated Outreach" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-gray-400"
            >
              <feature.icon size={14} className="text-gray-200" />
              <span>{feature.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Feature Grid - Problem Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="max-w-6xl mx-auto mt-32 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              Icon: Target,
              title: "Spray and pray fails",
              description: "You apply to 200 jobs. 195 never respond. Stop wasting time on roles you'd hate anyway.",
              color: "text-red-400"
            },
            {
              Icon: Cpu,
              title: "Algorithmic black holes",
              description: "Job boards match keywords, not potential. We decode your actual fit.",
              color: "text-blue-400"
            },
            {
              Icon: MessageSquareX,
              title: "Ghosted outreach",
              description: "Templates go to trash. You need hyper-personalized differentiation.",
              color: "text-yellow-400"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="glass-panel p-8 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className={`mb-6 p-3 rounded-lg bg-white/5 w-fit ${item.color}`}>
                <item.Icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderInput = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-6xl mx-auto relative">
      <SpaceBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full grid md:grid-cols-2 gap-12"
      >
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-4">Profile Analysis</h2>
            <p className="text-gray-400 text-lg font-light">
              Upload your resume and define your trajectory. We'll handle the strategy.
            </p>
          </div>
          
          <div className="glass-panel p-10 rounded-xl border border-dashed border-white/20 hover:border-white/40 transition-colors relative group bg-black/20">
              <input 
                type="file" 
                accept=".pdf,.txt,.md" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileUpload}
                disabled={isParsingPdf}
              />
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-4">
                 {isParsingPdf ? (
                    <>
                      <Loader2 className="animate-spin text-white" size={32} />
                      <p className="text-gray-400 text-sm">Processing document...</p>
                    </>
                 ) : uploadedFileName ? (
                    <>
                      <div className="p-4 rounded-full bg-green-500/10 text-green-400">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                         <p className="text-white font-medium text-sm">{uploadedFileName}</p>
                         <p className="text-green-400 text-xs mt-1">Ready for analysis</p>
                      </div>
                    </>
                 ) : (
                    <>
                      <div className="p-4 rounded-full bg-white/5 text-gray-400 group-hover:text-white transition-colors">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Upload Resume (PDF)</p>
                        <p className="text-gray-500 text-xs mt-1">Max 5MB</p>
                      </div>
                    </>
                 )}
              </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between">
           <div className="glass-panel p-8 rounded-xl h-full flex flex-col space-y-6 bg-black/40">
             
             {/* Ambitions Text */}
             <div>
               <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Career Ambitions</label>
                  <button 
                    onClick={handlePolish}
                    disabled={!aspirations.trim() || isPolishing}
                    className="text-xs flex items-center gap-1.5 text-[#00E3FF] hover:text-white transition-colors disabled:opacity-50 font-medium"
                  >
                    {isPolishing ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                    AI Polish
                  </button>
               </div>
               <textarea 
                  value={aspirations}
                  onChange={(e) => setAspirations(e.target.value)}
                  placeholder="Where do you want to be in 5 years? Be specific."
                  className="w-full h-28 bg-white/5 rounded-lg p-4 outline-none resize-none text-white text-sm placeholder-gray-500 focus:bg-white/10 border border-white/10 focus:border-white/30 transition-all"
                />
             </div>

             {/* Dropdowns (Multi-Select) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
               <MultiSelect 
                 label="Target Role" 
                 options={JOB_FUNCTIONS} 
                 selected={preferences.targetRole} 
                 onChange={(val) => setPreferences(prev => ({...prev, targetRole: val}))}
               />
               <MultiSelect 
                 label="Industry" 
                 options={INDUSTRIES} 
                 selected={preferences.targetIndustry} 
                 onChange={(val) => setPreferences(prev => ({...prev, targetIndustry: val}))}
               />
               <MultiSelect 
                 label="Company Type" 
                 options={COMPANY_TYPES} 
                 selected={preferences.targetCompanyType} 
                 onChange={(val) => setPreferences(prev => ({...prev, targetCompanyType: val}))}
               />
               <MultiSelect 
                 label="Location" 
                 options={LOCATIONS} 
                 selected={preferences.targetLocation} 
                 onChange={(val) => setPreferences(prev => ({...prev, targetLocation: val}))}
               />
             </div>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={!resumeText.trim() || isParsingPdf}
            className="w-full py-4 text-sm font-bold shadow-lg shadow-[#00E3FF]/10 bg-white hover:bg-gray-100 text-black border-none"
          >
            Start Analysis
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const renderProcessing = () => {
    const steps = [
      "Deconstructing resume syntax...",
      "Extracting psychological markers...",
      "Calculating ATS probabilities...",
      "Synthesizing career roadmap..."
    ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative">
         <SpaceBackground />
         <div className="relative mb-12">
            <div className="absolute inset-0 bg-[#00E3FF] blur-[60px] opacity-10 rounded-full animate-pulse"></div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-white/10 border-t-white rounded-full relative z-10"
            />
         </div>
         <h2 className="text-2xl font-bold mb-3 text-white">Analyzing Profile</h2>
         <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">{steps[loadingStep]}</p>
      </div>
    );
  };

  const renderError = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto relative">
      <SpaceBackground />
      <div className="glass-panel p-8 rounded-xl border border-red-500/20">
        <AlertTriangle className="text-red-400 mb-6 mx-auto" size={40} />
        <h2 className="text-xl font-bold mb-3 text-white">Analysis Failed</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">{errorMsg}</p>
        <Button onClick={() => setView(ViewState.INPUT)} variant="outline">Try Again</Button>
      </div>
    </div>
  );

  const ChatWidget = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
       <AnimatePresence>
         {isChatOpen && (
           <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="pointer-events-auto bg-[#0A0A0A] border border-white/10 shadow-2xl rounded-xl w-80 md:w-96 h-[500px] mb-4 overflow-hidden flex flex-col"
           >
             <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E3FF] to-[#0099FF] flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                   </div>
                   <div>
                     <span className="font-semibold text-sm block text-white">Career Coach</span>
                     <span className="text-[10px] text-green-400 block flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                     </span>
                   </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={16}/></button>
             </div>
             
             <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 text-xs px-8">
                    <MessageSquare size={24} className="mb-3 opacity-20" />
                    <p>Ask about salary negotiations, interview prep, or career transitions.</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                       msg.role === 'user' 
                         ? 'bg-white text-black' 
                         : 'bg-white/10 text-gray-200'
                     }`}>
                        {msg.text}
                     </div>
                  </div>
                ))}
                {isChatLoading && (
                   <div className="flex justify-start">
                     <div className="bg-white/5 p-3 rounded-lg flex gap-1 items-center">
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                     </div>
                   </div>
                )}
                <div ref={chatEndRef} />
             </div>

             <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-sm">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder-gray-600"
                  />
                  <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="p-2 bg-white rounded-lg text-black hover:bg-gray-200 disabled:opacity-50 transition-colors">
                     <Send size={16} />
                  </button>
                </form>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <button 
         onClick={() => setIsChatOpen(!isChatOpen)}
         className="pointer-events-auto w-12 h-12 rounded-full bg-white text-black shadow-lg shadow-white/10 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
       >
         {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
       </button>
    </div>
  );

  const renderDashboard = () => {
    if (!data) return null;

    const tabs = [
      { id: 'PERSONA', icon: User, label: 'Persona' },
      { id: 'ATS', icon: FileText, label: 'Audit' },
      { id: 'MAP', icon: Map, label: 'Career Map' },
      { id: 'ROADMAP', icon: ListTodo, label: 'Action Plan' },
    ];

    const currentRoadmap = customRoadmap || data?.prep_roadmap;
    const archetype = data?.user_persona?.archetype || 'Explorer';
    const traits = ARCHETYPE_TRAITS[archetype] || ARCHETYPE_TRAITS['Explorer'];

    return (
      <div className="min-h-screen pb-20 relative">
        <SpaceBackground />
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => setView(ViewState.LANDING)}>
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">CP</div>
              <span className="hidden md:block text-white">CareerPixel</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col items-end">
                 <span className="text-sm font-medium text-white">{data?.parsed_data?.name || 'User'}</span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-wider">{archetype}</span>
               </div>
               <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center">
                  <User size={14} className="text-gray-400"/>
               </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-6 py-8">
           <div className="flex justify-center md:justify-start mb-10">
             <div className="p-1 rounded-full bg-white/5 border border-white/5 inline-flex gap-1">
               {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                     activeTab === tab.id 
                       ? 'bg-white text-black shadow-md' 
                       : 'text-gray-400 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   <tab.icon size={14} strokeWidth={2.5} />
                   {tab.label}
                 </button>
               ))}
             </div>
           </div>

           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
             >
               {activeTab === 'PERSONA' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Identity Snapshot */}
                    <Card className="lg:col-span-8" accent="none" title="Executive Summary">
                      <div className="glass-panel p-8 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent">
                        <h1 className="text-2xl font-bold mb-4 text-white leading-tight">
                           {data?.user_persona?.headline}
                        </h1>
                        <p className="text-base leading-relaxed text-gray-400 font-light">
                          {data?.user_persona?.psych_profile}
                        </p>
                      </div>
                    </Card>

                    {/* Archetype Traits Card */}
                    <div className="lg:col-span-4">
                      <Card className="h-full flex flex-col justify-center" accent="white">
                          <Fingerprint size={32} className="text-white mb-4 opacity-50" />
                          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">Core Archetype</h2>
                          <div className="text-2xl font-bold text-white mb-6">{archetype}</div>
                          <div className="space-y-3">
                            {traits.map((trait, i) => (
                              <div key={i} className="py-2 px-3 rounded bg-white/5 text-xs font-medium text-gray-300 border border-white/5">
                                {trait}
                              </div>
                            ))}
                          </div>
                      </Card>
                    </div>

                    {/* Full SWOT */}
                    <div className="lg:col-span-12 grid md:grid-cols-4 gap-6">
                      <Card className="h-full" accent="none">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-500"/> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {data?.swot_analysis?.strengths?.map((s, i) => (
                            <li key={i} className="text-xs text-gray-400 leading-relaxed border-b border-white/5 last:border-0 pb-2">{s}</li>
                          ))}
                        </ul>
                      </Card>

                      <Card className="h-full" accent="none">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-yellow-500"/> Weaknesses
                        </h4>
                        <ul className="space-y-2">
                          {data?.swot_analysis?.weaknesses?.map((s, i) => (
                            <li key={i} className="text-xs text-gray-400 leading-relaxed border-b border-white/5 last:border-0 pb-2">{s}</li>
                          ))}
                        </ul>
                      </Card>

                      <Card className="h-full" accent="none">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Target size={14} className="text-blue-500"/> Opportunities
                        </h4>
                        <ul className="space-y-2">
                          {data?.swot_analysis?.opportunities?.map((s, i) => (
                            <li key={i} className="text-xs text-gray-400 leading-relaxed border-b border-white/5 last:border-0 pb-2">{s}</li>
                          ))}
                        </ul>
                      </Card>

                      <Card className="h-full" accent="none">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                          <ShieldAlert size={14} className="text-red-500"/> Threats
                        </h4>
                        <ul className="space-y-2">
                          {data?.swot_analysis?.threats?.map((s, i) => (
                            <li key={i} className="text-xs text-gray-400 leading-relaxed border-b border-white/5 last:border-0 pb-2">{s}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                 </div>
               )}

               {activeTab === 'ATS' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   {/* Score Card */}
                   <div className="lg:col-span-4 space-y-6">
                      <Card className="flex flex-col items-center justify-center text-center py-8">
                          <CircularProgress 
                            percentage={data?.ats_audit?.score || 0} 
                            color={(data?.ats_audit?.score || 0) > 70 ? '#10B981' : '#FBBF24'} 
                            size={140}
                            strokeWidth={8}
                            className="mx-auto"
                          />
                          <h3 className="text-xl font-bold mt-6 text-white">{data?.ats_audit?.verdict || 'N/A'}</h3>
                          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Score</p>
                      </Card>
                      
                      {/* Breakdown */}
                      <Card title="Score Breakdown">
                        <div className="space-y-4">
                          {data?.ats_audit?.score_breakdown?.map((item, i) => (
                            <div key={i} className="group">
                              <div className="flex justify-between text-xs mb-1 font-medium text-gray-300">
                                <span>{item.category}</span>
                                <span className={item.score > 70 ? 'text-green-400' : 'text-yellow-400'}>{item.score}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${item.score > 70 ? 'bg-green-500' : 'bg-yellow-500'} transition-all duration-1000`} 
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">{item.feedback}</p>
                            </div>
                          )) || <p className="text-gray-500 text-xs">No data.</p>}
                        </div>
                      </Card>
                   </div>
                   
                   {/* Critical Fixes */}
                   <div className="lg:col-span-8 space-y-6">
                     <Card title="Critical Improvements" accent="gold">
                       <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                         {data?.ats_audit?.critical_fixes?.map((item, i) => (
                           <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
                             <div className="md:w-28 shrink-0">
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
                                 {item.section}
                               </span>
                             </div>
                             <div className="flex gap-2">
                               <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={14} />
                               <p className="text-gray-300 text-sm leading-relaxed">{item.fix}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </Card>

                     <Card title="Missing Keywords" accent="turquoise">
                       <div className="flex flex-wrap gap-2">
                         {data?.ats_audit?.keyword_gaps?.map((kw, i) => (
                           <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-md text-xs font-medium hover:bg-white/10 transition-colors cursor-default">
                             {kw}
                           </span>
                         ))}
                       </div>
                     </Card>
                   </div>
                 </div>
               )}

               {activeTab === 'MAP' && (
                 <div className="space-y-8">
                   {/* Best Fit Roles */}
                   <div className="space-y-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-[#00E3FF] rounded-full"></div>
                        <h2 className="text-xl font-bold text-white">Best Fit Roles</h2>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {data?.career_map?.best_fit_roles?.map((role, i) => (
                          <div key={i} className="card-hover glass-panel p-6 rounded-xl border border-white/10 cursor-default h-full flex flex-col justify-between">
                             <div>
                               <div className="flex justify-between items-start mb-4">
                                 <Briefcase size={20} className="text-gray-400" />
                                 <span className="text-xl font-bold text-[#00E3FF]">{role.match_percentage}%</span>
                               </div>
                               <h3 className="text-lg font-bold text-white mb-2">{role.role}</h3>
                               <p className="text-xs text-gray-500 mb-4 font-mono">{role.salary_range}</p>
                               <p className="text-sm text-gray-400 leading-relaxed mb-6">{role.why_it_fits}</p>
                             </div>
                             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-[#00E3FF]" style={{ width: `${role.match_percentage}%` }}></div>
                             </div>
                          </div>
                        ))}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Market Data */}
                        <Card className="h-full" title="Market Intelligence" accent="gold">
                           {!marketInsights ? (
                             <div className="text-center py-6 h-32 flex flex-col items-center justify-center">
                               <p className="text-gray-500 text-sm mb-4">Get real-time data for your top role.</p>
                               <Button onClick={handleMarketInsights} disabled={isLoadingMarket} variant="outline" className="mx-auto text-xs py-2 px-4">
                                 {isLoadingMarket ? 'Searching...' : 'Fetch Live Data'}
                               </Button>
                             </div>
                           ) : (
                             <div className="prose prose-invert text-sm max-h-60 overflow-y-auto custom-scrollbar">
                                <p className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">{marketInsights}</p>
                             </div>
                           )}
                        </Card>

                        <Card title="Target Companies" className="h-full">
                          <div className="flex flex-wrap gap-2">
                              {data?.career_map?.top_companies?.map((co, i) => (
                                <a 
                                  key={i} 
                                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(co)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all flex items-center gap-2 group"
                                >
                                  {co}
                                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </a>
                              ))}
                          </div>
                        </Card>
                   </div>

                   {/* Gap Analysis */}
                   <div className="space-y-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-[#FFD700] rounded-full"></div>
                        <h2 className="text-xl font-bold text-white">Gap Analysis</h2>
                     </div>
                     <div className="grid md:grid-cols-3 gap-6">
                       <div className="glass-panel p-6 rounded-xl border-t-2 border-t-red-500">
                          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Brain size={14} className="text-red-500"/> Skill Gaps</h3>
                          <ul className="space-y-3">
                            {data?.career_map?.gap_analysis?.skill_gaps?.map((g, i) => (
                              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 shrink-0"/> 
                                <span className="leading-snug">{g}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                       
                       <div className="glass-panel p-6 rounded-xl border-t-2 border-t-yellow-500">
                          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={14} className="text-yellow-500"/> Experience Gaps</h3>
                          <ul className="space-y-3">
                            {data?.career_map?.gap_analysis?.experience_gaps?.map((g, i) => (
                              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 shrink-0"/> 
                                <span className="leading-snug">{g}</span>
                              </li>
                            ))}
                          </ul>
                       </div>

                       <div className="glass-panel p-6 rounded-xl border-t-2 border-t-blue-500">
                          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Building2 size={14} className="text-blue-500"/> Project Gaps</h3>
                          <ul className="space-y-3">
                            {data?.career_map?.gap_analysis?.project_gaps?.map((g, i) => (
                              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 shrink-0"/> 
                                <span className="leading-snug">{g}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {activeTab === 'ROADMAP' && (
                 <div className="space-y-8">
                   {/* Custom Roadmap Generator */}
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4 glass-panel p-6 rounded-xl">
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white">Strategic Roadmap</h3>
                        <p className="text-gray-400 text-xs">Customized week-by-week execution plan.</p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                           <span className="text-xs text-gray-400">Duration:</span>
                           <select 
                             value={roadmapDuration}
                             onChange={(e) => setRoadmapDuration(Number(e.target.value))}
                             className="bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
                           >
                             {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                               <option key={w} value={w} className="bg-black text-white">{w} Weeks</option>
                             ))}
                           </select>
                        </div>
                        <Button onClick={handleGenerateRoadmap} disabled={isGeneratingRoadmap} variant="primary" className="py-1.5 px-4 text-xs h-9">
                          {isGeneratingRoadmap ? <Loader2 className="animate-spin" size={14}/> : 'Generate'}
                        </Button>
                      </div>
                   </div>

                   {/* Roadmap Timeline */}
                   <div className="space-y-8">
                     {currentRoadmap?.map((week, idx) => (
                       <div key={idx} className="relative group">
                         <div className="absolute left-[15px] top-10 bottom-[-32px] w-px bg-white/10 hidden md:block group-last:hidden"></div>
                         
                         <div className="md:pl-12 relative">
                            {/* Week Badge */}
                            <div className="hidden md:flex absolute left-0 top-0 w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold items-center justify-center z-10">
                              {idx + 1}
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                              <h3 className="text-xl font-bold text-white"><span className="md:hidden text-gray-500 mr-2">Week {idx+1}:</span>{week.theme}</h3>
                            </div>
                            
                            <div className="grid lg:grid-cols-2 gap-6">
                              <Card title="Daily Actions" className="h-full">
                                <ul className="space-y-3">
                                  {week.daily_tasks.map((task: string, tIdx: number) => (
                                    <li key={tIdx} className="flex gap-3 text-sm text-gray-300">
                                      <div className="mt-1 w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center shrink-0">
                                        <div className="w-2 h-2 bg-white/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>
                                      </div>
                                      <span className="leading-relaxed font-light">{task}</span>
                                    </li>
                                  ))}
                                </ul>
                              </Card>
                              
                              <div className="space-y-6">
                                <Card title="Resources" accent="turquoise">
                                  <ul className="space-y-2">
                                    {week.resources.map((res: string, rIdx: number) => (
                                      <li key={rIdx}>
                                        <a 
                                          href={`https://www.google.com/search?q=${encodeURIComponent(res)}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors group/link"
                                        >
                                          <Search size={14} className="text-gray-500 group-hover/link:text-white transition-colors" />
                                          <span className="text-xs text-gray-400 group-hover/link:text-white underline-offset-4 group-hover/link:underline transition-all">{res}</span>
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </Card>
                                
                                <Card title="Deliverables" accent="white">
                                  <ul className="space-y-2">
                                    {week.deliverables.map((del: string, dIdx: number) => (
                                      <li key={dIdx} className="text-xs text-white font-medium flex items-center gap-2">
                                        <CheckCircle2 size={12} className="text-[#00E3FF]" />
                                        {del}
                                      </li>
                                    ))}
                                  </ul>
                                </Card>
                              </div>
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </motion.div>
           </AnimatePresence>
        </div>
        <ChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#00E3FF] selection:text-white">
      {view === ViewState.LANDING && renderLanding()}
      {view === ViewState.INPUT && renderInput()}
      {view === ViewState.PROCESSING && renderProcessing()}
      {view === ViewState.ERROR && renderError()}
      {view === ViewState.DASHBOARD && renderDashboard()}
    </div>
  );
}

export default App;
