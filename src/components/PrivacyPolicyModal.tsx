import React, { useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, EyeOff, ServerOff } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
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

  return (
    <div
      id="privacy-policy-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Privacy Policy & Play Store Compliance
              </h2>
              <p className="text-xs text-emerald-600 font-medium">
                Offline-First Local Video Processing
              </p>
            </div>
          </div>

          <button
            id="privacy-policy-modal-close-x"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-sm text-slate-700 bg-white">
          {/* Core Privacy Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <ServerOff className="w-6 h-6 text-[#ff003f] mx-auto mb-1.5" />
              <div className="font-bold text-xs text-slate-900">100% On-Device</div>
              <div className="text-[11px] text-slate-500 mt-0.5">No servers or cloud uploads</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <EyeOff className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Zero Collection</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Video contents never tracked</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <Lock className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <div className="font-bold text-xs text-slate-900">Scoped Storage</div>
              <div className="text-[11px] text-slate-500 mt-0.5">No broad permissions</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">1. Video Processing Guarantee</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Episode Splitter processes all video clips directly on your device utilizing Android&apos;s local Media3 Transformer and native FFmpeg-Kit binaries. Under no circumstances are video files, frames, audio tracks, or metadata transmitted over the network.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">2. Permission Minimization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In strict accordance with Google Play developer policies, this application uses the modern Android Photo Picker (<code className="text-[#ff003f] bg-rose-50 px-1 py-0.5 rounded font-mono text-[11px] border border-rose-100">PickVisualMedia</code>). The app does not request access to your contacts, camera, microphone, device location, or broad external storage.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">3. Google Play Publication Readiness</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Target API Level: Android 15 (API 35)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Modern AAB (Android App Bundle) release configuration</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ProGuard / R8 code shrinking and rule optimization</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Adaptive vector icons & light modern UI styling</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            id="privacy-policy-close-button"
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold transition-all shadow-sm shadow-rose-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
