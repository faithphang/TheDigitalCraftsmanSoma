import { Pencil, Sparkles, Home, Palette, Layers, Plus } from 'lucide-react';
import { SomaLogo } from './SomaLogo';
import TdMovieOut from '../imports/TdMovieOut01';
import { SavedProject } from '../App';
import { Trash2 } from 'lucide-react';
import craftsmanLogo from 'figma:asset/a0cacb234445eda312b3e3f327be59e0750bd6f2.png';

interface LauncherProps {
  onLaunchApp: (app: 'photo-editor' | 'graphic-designer') => void;
  onOpenNodeEditor: () => void;
  savedProjects: SavedProject[];
  onLoadProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export function Launcher({ onLaunchApp, onOpenNodeEditor, savedProjects, onLoadProject, onNewProject, onDeleteProject }: LauncherProps) {
  return (
    <div className="w-full h-full bg-black flex relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Sidebar */}
      <div className="w-64 bg-black/80 backdrop-blur-sm border-r border-white/10 flex flex-col relative z-10 overflow-hidden">
        {/* ASCII Video Background for Left Sidebar */}
        <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-lighten">
          <TdMovieOut />
        </div>

        <div className="p-6 relative z-10">
          {/* SOMA Logo Block */}
          <div className="relative bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-lg size-12 flex items-center justify-center p-2 border border-white/10">
                <SomaLogo className="w-full h-full" />
              </div>
              <div>
                <h2 className="text-white tracking-[-1.44px]" style={{ fontWeight: 500 }}>SOMA</h2>
                <p className="text-white/40 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>Build Tools</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {/* Minimal Buttons */}
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all text-left tracking-[-0.96px]" style={{ fontWeight: 300 }}>
              <Home className="w-4 h-4" />
              <span>home</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all text-left tracking-[-0.96px]" style={{ fontWeight: 300 }}>
              <Palette className="w-4 h-4" />
              <span>design tools</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all text-left tracking-[-0.96px]" style={{ fontWeight: 300 }}>
              <Layers className="w-4 h-4" />
              <span>projects</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10 relative z-10">
          <button onClick={onOpenNodeEditor} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white hover:bg-white/10 transition-all border border-white/20 tracking-[-0.96px]" style={{ fontWeight: 300 }}>
            <Plus className="w-4 h-4" />
            <span>make your own tool</span>
          </button>
          
          {/* The Digital Craftsman Logo */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center">
            <img 
              src={craftsmanLogo} 
              alt="The Digital Craftsman" 
              className="h-4 opacity-30 hover:opacity-50 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative z-10">
        <div className="p-8">
          {/* Header */}
          <div className="mb-12 relative overflow-hidden">
            {/* ASCII Video Background for Header */}
            <div className="absolute inset-0 -mx-8 -mt-0 h-32 opacity-40 pointer-events-none mix-blend-lighten">
              <TdMovieOut />
            </div>
            
            <div className="relative z-10">
              <h1 className="text-white text-[64px] leading-[0.71] tracking-[-10.24px] mb-2" style={{ fontWeight: 500 }}>Explore</h1>
              <p className="text-white/40 text-[18px] tracking-[-1.44px]" style={{ fontWeight: 300 }}>Choose your creative tool</p>
            </div>
          </div>

          {/* Featured Apps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-[24px] tracking-[-1.92px]" style={{ fontWeight: 500 }}>Featured Tools</h2>
              <button className="text-white/40 hover:text-white text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>see all</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphic Designer */}
              <button
                onClick={() => onLaunchApp('graphic-designer')}
                className="relative group bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 text-left p-8"
              >
                <div className="relative">
                  <div className="relative bg-white/10 size-16 flex items-center justify-center mb-6 group-hover:bg-white/15 transition-colors duration-300">
                    <Pencil className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-white text-[32px] tracking-[-2.56px] mb-3" style={{ fontWeight: 500 }}>Graphic Designer</h3>
                  <p className="text-white/50 text-[16px] tracking-[-1.28px] mb-6" style={{ fontWeight: 300 }}>
                    Create vector graphics with advanced tools and layers
                  </p>
                  
                  <div className="flex items-center gap-2 text-white/30 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                    <Layers className="w-3 h-3" />
                    <span>multi-layer support</span>
                  </div>
                </div>
              </button>

              {/* Photo Editor - Coming Soon */}
              <button
                onClick={() => onLaunchApp('photo-editor')}
                className="relative group bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 text-left p-8"
              >
                <div className="relative">
                  <div className="relative bg-white/10 size-16 flex items-center justify-center mb-6 group-hover:bg-white/15 transition-colors duration-300">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-white text-[32px] tracking-[-2.56px] mb-3" style={{ fontWeight: 500 }}>Photo Editor</h3>
                  <p className="text-white/50 text-[16px] tracking-[-1.28px] mb-6" style={{ fontWeight: 300 }}>
                    Edit and enhance your photos with blend modes and adjustments
                  </p>
                  
                  <div className="flex items-center gap-2 text-white/30 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                    <Palette className="w-3 h-3" />
                    <span>advanced filters</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Popular Right Now */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-[24px] tracking-[-1.92px]" style={{ fontWeight: 500 }}>Recent Projects</h2>
              <button className="text-white/40 hover:text-white text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>see all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.length === 0 ? (
                <button
                  onClick={onNewProject}
                  className="relative bg-white/5 border border-white/10 border-dashed hover:border-white/20 transition-all cursor-pointer p-6 flex flex-col items-center justify-center gap-3"
                >
                  <Plus className="w-8 h-8 text-white/40" />
                  <p className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>create your first project</p>
                </button>
              ) : (
                <>
                  {savedProjects.slice().reverse().map((project) => (
                    <div
                      key={project.id}
                      className="relative bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                    >
                      <button onClick={() => onLoadProject(project.id)} className="w-full p-6 text-left">
                        <div className="aspect-video bg-white/5 mb-4 border border-white/10 overflow-hidden">
                          {project.thumbnail && (
                            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <h4 className="text-white text-[18px] tracking-[-1.44px] mb-2" style={{ fontWeight: 500 }}>{project.name}</h4>
                        <p className="text-white/30 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                          {new Date(project.timestamp).toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-white/60 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={onNewProject}
                    className="relative bg-white/5 border border-white/10 border-dashed hover:border-white/20 transition-all cursor-pointer p-6 flex flex-col items-center justify-center gap-3"
                  >
                    <Plus className="w-8 h-8 text-white/40" />
                    <p className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>new project</p>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-black/80 backdrop-blur-sm border-l border-white/10 p-6 hidden xl:block relative z-10 overflow-hidden">
        {/* ASCII Video Background for Right Sidebar */}
        <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-lighten">
          <TdMovieOut />
        </div>

        <div className="mb-8 relative z-10">
          <div className="relative bg-white/5 border border-white/10 p-6 text-center">
            <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4 border border-white/10" />
            <h3 className="text-white text-[18px] tracking-[-1.44px] mb-1" style={{ fontWeight: 500 }}>Welcome</h3>
            <p className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>@creative_user</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-[18px] tracking-[-1.44px]" style={{ fontWeight: 500 }}>Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all text-left text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>
              <div className="w-8 h-8 bg-white/10 flex items-center justify-center border border-white/10">
                <Layers className="w-4 h-4" />
              </div>
              <span>new canvas</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all text-left text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>
              <div className="w-8 h-8 bg-white/10 flex items-center justify-center border border-white/10">
                <Palette className="w-4 h-4" />
              </div>
              <span>color picker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}