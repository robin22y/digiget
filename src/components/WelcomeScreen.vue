<template>
  <div class="welcome-container">
    <div class="scroll-wrapper">
      <div class="content-wrapper">
        
        <!-- Hero Section -->
        <header class="hero-section">
          <div class="logo-section">
            <div class="icon-pulse">
              <!-- Using the SVG logo directly for best quality -->
              <img src="/logo.svg" alt="Digiget Logo" class="w-24 h-24 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </div>
            <h1 class="app-title">Digiget</h1>
          </div>

          <div class="text-center space-y-4 mt-6">
            <h2 class="tagline-text">
              Did I Get Everything?
              <span class="checkmark">✓</span>
            </h2>
            <p class="description-text">
              The essential <strong>end-of-shift safety checklist</strong> for nurses. <br />
              Secure your <strong>keys, meds, ID, and handover</strong> before you leave the ward.
            </p>
          </div>

          <button class="start-btn" @click="$emit('start')">
            Start Shift Check
            <ArrowRight :size="20" />
          </button>

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
        </header>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator animate-bounce text-zinc-600 mt-12 mb-4">
          <span class="text-[10px] uppercase tracking-widest mb-1 block text-center">Learn More</span>
          <ArrowDown :size="20" class="mx-auto" />
        </div>

        <!-- SEO Content Sections -->
        <main class="info-sections space-y-16 w-full max-w-md text-left pb-12 border-t border-zinc-800/50 pt-12">
          
          <!-- Why Digiget Exists -->
          <section>
            <h3 class="section-title">Why Digiget Exists</h3>
            <p class="section-text">
              Every nurse knows the feeling. You're halfway home and suddenly panic: <em>"Did I return the keys? Did I sign the controlled drugs? Did I complete the handover?"</em>
            </p>
            <p class="section-text mt-4">
              Digiget was built to prevent anxious visits back to the hospital. It's a simple, specialized <strong>end-of-shift checklist</strong> that takes 30 seconds and gives you total peace of mind. No sign-up. No data collection. Just swipe through your checks and go home.
            </p>
          </section>

          <!-- How It Works -->
          <section>
            <h3 class="section-title">How It Works</h3>
            <div class="steps-list space-y-6 mt-6">
              <div class="step-row">
                <div class="step-number">1</div>
                <div>
                  <h4 class="step-title">Open the App</h4>
                  <p class="step-desc">No login required. Works completely offline. Instant access when you need it most.</p>
                </div>
              </div>
              <div class="step-row">
                <div class="step-number">2</div>
                <div>
                  <h4 class="step-title">Swipe Your Checklist</h4>
                  <p class="step-desc">Keys returned? Swipe right. Meds signed? Swipe right. Confirm each critical item.</p>
                </div>
              </div>
              <div class="step-row">
                <div class="step-number">3</div>
                <div>
                  <h4 class="step-title">Leave Work Behind</h4>
                  <p class="step-desc">Get the green tick. Drive home knowing you didn't forget a single thing.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Who Uses It -->
          <section>
            <h3 class="section-title">Who Uses Digiget?</h3>
            <ul class="user-list space-y-3 mt-4">
              <li class="flex items-start gap-3">
                <Check :size="18" class="text-blue-500 mt-0.5 shrink-0" />
                <span class="text-zinc-400 text-sm"><strong>Ward Nurses</strong> checking keys, ID, and medication documentation.</span>
              </li>
              <li class="flex items-start gap-3">
                <Check :size="18" class="text-blue-500 mt-0.5 shrink-0" />
                <span class="text-zinc-400 text-sm"><strong>Theatre Nurses</strong> confirming instrument counts and equipment.</span>
              </li>
              <li class="flex items-start gap-3">
                <Check :size="18" class="text-blue-500 mt-0.5 shrink-0" />
                <span class="text-zinc-400 text-sm"><strong>Community Nurses</strong> ensuring all notes and patient handovers are complete.</span>
              </li>
              <li class="flex items-start gap-3">
                <Check :size="18" class="text-blue-500 mt-0.5 shrink-0" />
                <span class="text-zinc-400 text-sm"><strong>Agency Staff</strong> working across multiple trusts and unfamiliar wards.</span>
              </li>
            </ul>
          </section>

          <!-- FAQ Snippet -->
          <section>
            <h3 class="section-title">Frequently Asked Questions</h3>
            <div class="space-y-6 mt-6">
              <div>
                <h4 class="font-bold text-zinc-200 text-sm">Do I need an account?</h4>
                <p class="text-zinc-500 text-sm mt-1 leading-relaxed">No. Digiget works instantly without any sign-up or login. Just open it and start checking.</p>
              </div>
              <div>
                <h4 class="font-bold text-zinc-200 text-sm">Is my data private?</h4>
                <p class="text-zinc-500 text-sm mt-1 leading-relaxed">Yes. Everything stays on your device. We do not collect or store any personal information or patient data.</p>
              </div>
              <div>
                <h4 class="font-bold text-zinc-200 text-sm">Does it work without internet?</h4>
                <p class="text-zinc-500 text-sm mt-1 leading-relaxed">Yes. Digiget is a Progressive Web App (PWA). Once loaded, it works completely offline, perfect for hospitals with poor signal.</p>
              </div>
            </div>
          </section>

        </main>

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
import { WifiOff, Lock, Zap, ArrowRight, ArrowDown, Check } from 'lucide-vue-next'

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
  scroll-behavior: smooth;
}

.content-wrapper {
  @apply flex-1 flex flex-col items-center justify-start gap-8 max-w-md w-full p-6 pt-12;
}

/* Hero Section */
.hero-section {
  @apply flex flex-col items-center w-full;
  /* Ensure hero takes up most of the initial screen height */
  min-height: 80vh; 
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  @apply text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter mt-4;
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
  text-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
}

.description-text {
  @apply text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto;
  opacity: 0;
  animation: fadeIn 0.8s ease-out forwards 0.6s;
}

/* Features Grid */
.features-grid {
  @apply flex flex-wrap justify-center gap-3 w-full mt-8;
  opacity: 0;
  animation: fadeIn 0.8s ease-out forwards 1.3s;
}

.feature-item {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400 backdrop-blur-sm;
}

/* CTA Button */
.start-btn {
  @apply w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-900/30
         hover:from-blue-500 hover:to-blue-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
         flex items-center justify-center gap-2 border border-blue-400/20 mt-8;
  opacity: 0;
  animation: slideUpFade 0.8s ease-out forwards 1.0s;
}

/* Content Sections */
.section-title {
  @apply text-xl font-bold text-white mb-4 border-l-4 border-blue-500 pl-3;
}

.section-text {
  @apply text-zinc-400 text-sm leading-relaxed;
}

.step-row {
  @apply flex gap-4 items-start;
}

.step-number {
  @apply w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center flex-shrink-0 text-sm border border-zinc-700;
}

.step-title {
  @apply text-zinc-200 font-bold text-sm;
}

.step-desc {
  @apply text-zinc-500 text-sm mt-1 leading-relaxed;
}

/* Footer */
.legal-footer {
  @apply w-full py-12 flex flex-col items-center gap-4 mt-auto border-t border-zinc-900/50 bg-zinc-950/80 backdrop-blur-sm;
}

.footer-links {
  @apply flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-zinc-500 px-4;
}

.footer-link {
  @apply hover:text-zinc-300 transition-colors cursor-pointer;
}

.dot {
  @apply text-zinc-700;
}

.copyright {
  @apply text-[10px] text-zinc-700;
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
