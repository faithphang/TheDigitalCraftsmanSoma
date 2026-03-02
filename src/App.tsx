import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Launcher } from './components/Launcher';
import { PhotoEditor } from './components/PhotoEditor';
import { GraphicDesigner } from './components/GraphicDesigner';
import { NodeEditor } from './components/NodeEditor';
import { Onboarding, UserProfile } from './components/Onboarding';

type AppView = 'onboarding' | 'landing' | 'launcher' | 'photo-editor' | 'graphic-designer' | 'node-editor';

export interface SavedProject {
  id: string;
  name: string;
  thumbnail: string;
  data: any;
  timestamp: number;
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [customBrushes, setCustomBrushes] = useState<any[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    const saved = localStorage.getItem('soma-projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('soma-user-profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Check if user needs onboarding
  useEffect(() => {
    if (!userProfile) {
      setCurrentView('onboarding');
    }
  }, [userProfile]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('soma-user-profile', JSON.stringify(profile));
    setCurrentView('landing');
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('soma-user-profile', JSON.stringify(profile));
  };

  const handleSaveBrush = (brush: any) => {
    setCustomBrushes([...customBrushes, brush]);
    console.log('Saved custom brush:', brush);
  };

  const handleSaveProject = (projectData: any, thumbnail: string, name: string) => {
    const existingProjectIndex = savedProjects.findIndex(p => p.id === currentProjectId);
    
    if (existingProjectIndex !== -1) {
      // Update existing project
      const updatedProjects = [...savedProjects];
      updatedProjects[existingProjectIndex] = {
        ...updatedProjects[existingProjectIndex],
        name,
        thumbnail,
        data: projectData,
        timestamp: Date.now(),
      };
      setSavedProjects(updatedProjects);
      localStorage.setItem('soma-projects', JSON.stringify(updatedProjects));
    } else {
      // Create new project
      const newProject: SavedProject = {
        id: Date.now().toString(),
        name,
        thumbnail,
        data: projectData,
        timestamp: Date.now(),
      };
      const updatedProjects = [...savedProjects, newProject];
      setSavedProjects(updatedProjects);
      localStorage.setItem('soma-projects', JSON.stringify(updatedProjects));
      setCurrentProjectId(newProject.id);
    }
  };

  const handleLoadProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentView('graphic-designer');
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setCurrentView('graphic-designer');
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    localStorage.setItem('soma-projects', JSON.stringify(updatedProjects));
  };

  const getCurrentProject = () => {
    if (!currentProjectId) return null;
    return savedProjects.find(p => p.id === currentProjectId) || null;
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {currentView === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      {currentView === 'landing' && (
        <LandingPage onEnter={() => setCurrentView('launcher')} />
      )}
      {currentView === 'launcher' && userProfile && (
        <Launcher 
          onLaunchApp={setCurrentView} 
          onOpenNodeEditor={() => setCurrentView('node-editor')}
          savedProjects={savedProjects}
          onLoadProject={handleLoadProject}
          onNewProject={handleNewProject}
          onDeleteProject={handleDeleteProject}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
        />
      )}
      {currentView === 'photo-editor' && (
        <PhotoEditor onBack={() => setCurrentView('launcher')} />
      )}
      {currentView === 'graphic-designer' && (
        <GraphicDesigner 
          onBack={() => setCurrentView('launcher')} 
          customBrushes={customBrushes}
          onSaveProject={handleSaveProject}
          initialProject={getCurrentProject()}
        />
      )}
      {currentView === 'node-editor' && (
        <NodeEditor 
          onClose={() => setCurrentView('launcher')}
          onSaveBrush={handleSaveBrush}
        />
      )}
    </div>
  );
}