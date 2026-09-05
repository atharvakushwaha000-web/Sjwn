import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileCode,
  FolderArchive,
  Check,
  Copy,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';
import { AndroidProjectFile } from '../types';
import { soundService } from '../utils/audioEffects';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(
    ANDROID_PROJECT_FILES[4] // MainActivity.kt default
  );
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundService.triggerButtonHaptic();
    onClose();
  };

  const handleCopy = () => {
    soundService.triggerButtonHaptic();
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFullZip = async () => {
    soundService.triggerButtonHaptic();
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const root = zip.folder('EpisodeSplitter');

      // Add all project files into their relative paths
      ANDROID_PROJECT_FILES.forEach((f) => {
        root?.file(f.path, f.content);
      });

      // Add gradle wrapper properties placeholder
      root?.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EpisodeSplitter-AndroidStudioProject.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      soundService.playProcessingCompleted();
    } catch {
      soundService.playError();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="android-project-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#ff003f]">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>Android Studio Native Project</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 font-mono font-bold">
                  Play Store Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Package: <code className="text-[#ff003f] font-mono">com.episodesplitter.video</code> • Target SDK 35
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="download-android-project-zip-button"
              type="button"
              onClick={handleDownloadFullZip}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}</span>
            </button>

            <button
              id="android-project-modal-close-button"
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Explorer Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-3 overflow-y-auto shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 mb-1 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Project Files</span>
            </div>

            <div className="space-y-1">
              {ANDROID_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => {
                      soundService.triggerButtonHaptic();
                      setSelectedFile(file);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-rose-50 text-[#ff003f] border border-rose-200 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {/* File Info Bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 bg-slate-950">
              <div className="min-w-0 pr-4">
                <span className="text-xs font-mono font-bold text-white block truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {selectedFile.description}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 selection:bg-rose-500/30">
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
