<template>
  <div class="welcome-container">
    <div class="scroll-wrapper">
      <div class="content-wrapper">
        
        <!-- Logo / Brand -->
        <div class="logo-section">
          <div class="icon-pulse">
            <ShieldCheck :size="72" class="text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" stroke-width="1.5" />
          </div>
          <h1 class="app-title">Digiget</h1>
        </div>

        <!-- The Tagline & Description -->
        <div class="text-center space-y-4">
          <h2 class="tagline-text">
            Did I Get Everything?
            <span class="checkmark">✓</span>
          </h2>
          <p class="description-text">
            The essential <strong>end-of-shift safety checklist</strong> for nurses. <br />
            Secure your <strong>keys, meds, ID, and handover</strong> before you leave the ward.
          </p>
        </div>

        <!-- Install Button (Only visible if browser allows) -->
        <button 
          v-if="canInstall"
          class="install-btn" 
          @click="$emit('install')"
        >
          <Download :size="18" />
          Install App
        </button>

        <!-- Call to Action -->
        <button class="start-btn" @click="$emit('start')">
          Start Shift Check
          <ArrowRight :size="20" />
        </button>

        <!-- Informative Features -->
        <div class="features-grid">
          <div class="feature-item">
            <WifiOff :size="16" class="text-blue-400" />
            <span>Offline Ready</span>
          </div>
          <div class="feature-item">
            <Lock :size="16" class="text-green-400" />
            <span>Private</span>
          </div>
          <div class="feature-item">
            <Zap :size="16" class="text-amber-400" />
            <span>Fast</span>
          </div>
        </div>

        <!-- How it Works Mini-Section -->
        <div class="how-it-works">
          <div class="step">
            <div class="step-icon"><Layers :size="20" /></div>
            <span>Swipe Cards</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-icon"><CheckCircle2 :size="20" /></div>
            <span>Confirm</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-icon"><Coffee :size="20" /></div>
            <span>Relax</span>
          </div>
        </div>

      </div>

      <!-- Legal Footer -->
      <footer class="legal-footer">
        <div class="footer-links">
          <button class="footer-link" @click="$emit('open-info', 'privacy')">Privacy Policy</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="$emit('open-info', 'terms')">Terms</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="$emit('open-info', 'cookie')">Cookie Policy</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="$emit('open-info', 'sitemap')">Site Map</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="$emit('open-info', 'faq')">FAQ</button>
        </div>
        <p class="copyright">© {{ new Date().getFullYear() }} Digiget. Not an official NHS app.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ShieldCheck, WifiOff, Lock, Zap, ArrowRight, Layers, CheckCircle2, Coffee, Download } from 'lucide-vue-next'

defineProps({
  canInstall: {
    type: Boolean,
    default: false
  }
})

defineEmits(['start', 'open-info', 'install'])
</script>

<style scoped>
.welcome-container {
  @apply fixed inset-0 bg-zinc-950 z-50 overflow-hidden;
  background-image: radial-gradient(circle at 50% 0%, #1e1e24 0%, #09090b 80%);
}

.scroll-wrapper {
  @apply h-full w-full overflow-y-auto flex flex-col items-center;
  /* Ensure footer sits at bottom if content is short */
  min-height: 100vh; 
}

.content-wrapper {
  @apply flex-1 flex flex-col items-center justify-center gap-8 max-w-sm w-full p-6 pt-12;
}

/* Logo Animation */
.logo-section {
  @apply flex flex-col items-center gap-3;
  animation: float 6s ease-in-out infinite;
}

.icon-pulse {
  @apply relative;
}

.icon-pulse::after {
  content: '';
  @apply absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse;
}

.app-title {
  @apply text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter;
}

/* Text Styling */
.tagline-text {
  @apply text-2xl font-semibold text-zinc-200 flex items-center justify-center gap-2;
  opacity: 0;
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.3s;
}

.checkmark {
  @apply text-green-500 text-3xl font-bold inline-block;
  opacity: 0;
  transform: scale(0) rotate(-45deg);
  animation: stampIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1.0s;
}

.description-text {
  @apply text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto;
  opacity: 0;
  animation: fadeIn 0.8s ease-out forwards 0.6s;
}

/* Features Grid */
.features-grid {
  @apply flex flex-wrap justify-center gap-3 w-full;
  opacity: 0;
  animation: fadeIn 0.8s ease-out forwards 1.3s;
}

.feature-item {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400;
}

/* CTA Buttons */
.install-btn {
  @apply w-full max-w-xs bg-zinc-800 text-zinc-300 font-bold text-sm py-3 rounded-xl border border-zinc-700
         hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2 mb-2;
  opacity: 0;
  animation: slideUpFade 0.8s ease-out forwards 0.8s;
}

.start-btn {
  @apply w-full bg-white text-zinc-950 font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-900/10
         hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
         flex items-center justify-center gap-2;
  opacity: 0;
  animation: slideUpFade 0.8s ease-out forwards 1.0s;
}

/* How It Works */
.how-it-works {
  @apply flex items-center justify-between w-full max-w-[280px] mt-2 opacity-0;
  animation: fadeIn 0.8s ease-out forwards 1.6s;
}

.step {
  @apply flex flex-col items-center gap-2;
}

.step-icon {
  @apply w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400;
}

.step span {
  @apply text-[10px] font-bold uppercase text-zinc-600 tracking-wide;
}

.step-line {
  @apply flex-1 h-[1px] bg-zinc-800 -mt-5 mx-2;
}

/* Footer */
.legal-footer {
  @apply w-full py-8 flex flex-col items-center gap-3 mt-auto border-t border-zinc-900/50 bg-zinc-950/50 backdrop-blur-sm;
  opacity: 0;
  animation: fadeIn 0.8s ease-out forwards 1.8s;
}

.footer-links {
  @apply flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-xs text-zinc-500 px-4;
}

.footer-link {
  @apply hover:text-zinc-300 transition-colors cursor-pointer;
}

.dot {
  @apply text-zinc-700;
}

.copyright {
  @apply text-[10px] text-zinc-700 mt-2;
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes stampIn {
  from { opacity: 0; transform: scale(2) rotate(-45deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
