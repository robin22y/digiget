<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <Database :size="24" class="text-blue-500" />
          Car Park Control
        </h2>
        <div class="flex gap-4 mt-2 text-sm">
          <button 
            @click="activeTab = 'metrics'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'metrics' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Metrics
          </button>
          <button 
            @click="activeTab = 'ads'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'ads' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Ad Manager
          </button>
          <button 
            @click="activeTab = 'notices'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'notices' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Notices
          </button>
          <button 
            @click="activeTab = 'testing'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'testing' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Testing
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          @click="handleLogout" 
          class="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
          title="Untrust Device"
        >
          <Lock :size="20" />
        </button>
        <button @click="$emit('close')" class="exit-btn">
          <LogOut :size="20" />
        </button>
      </div>
    </div>

    <!-- METRICS TAB (Cockpit Dashboard) -->
    <div v-if="activeTab === 'metrics'" class="p-6 overflow-y-auto flex-1">
      <div v-if="loadingMetrics" class="p-8 text-center text-zinc-500">
        Calculating metrics...
      </div>
      
      <div v-else class="space-y-6">
        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Users -->
          <div class="metric-card">
            <div class="metric-header">
              <Users :size="20" class="text-blue-400" />
              <span class="metric-label">Total Users</span>
            </div>
            <div class="metric-value">{{ metrics.totalUsers.toLocaleString() }}</div>
            <div class="metric-change" :class="metrics.newUsersToday > 0 ? 'text-green-400' : 'text-zinc-500'">
              {{ metrics.newUsersToday > 0 ? '+' : '' }}{{ metrics.newUsersToday }} today
            </div>
          </div>

          <!-- Active Today (DAU) -->
          <div class="metric-card">
            <div class="metric-header">
              <Activity :size="20" class="text-green-400" />
              <span class="metric-label">Active Today</span>
            </div>
            <div class="metric-value">{{ metrics.dau.toLocaleString() }}</div>
            <div class="metric-change" :class="getEngagementClass(metrics.dau)">
              {{ getEngagementText(metrics.dau) }}
            </div>
          </div>

          <!-- Crashes -->
          <div class="metric-card">
            <div class="metric-header">
              <AlertTriangle :size="20" class="text-yellow-400" />
              <span class="metric-label">Crashes</span>
            </div>
            <div class="metric-value">{{ metrics.crashes }}</div>
            <div class="metric-change" :class="metrics.crashes === 0 ? 'text-green-400' : 'text-red-400'">
              {{ metrics.crashes === 0 ? 'System Healthy' : 'Investigate' }}
            </div>
          </div>

          <!-- Completion Rate -->
          <div class="metric-card">
            <div class="metric-header">
              <CheckCircle :size="20" class="text-purple-400" />
              <span class="metric-label">Completion Rate</span>
            </div>
            <div class="metric-value">{{ metrics.completionRate }}%</div>
            <div class="metric-change text-zinc-500">
              {{ metrics.completedSessions }} / {{ metrics.totalSessions }} sessions
            </div>
          </div>

          <!-- Users Who Modified Cards -->
          <div class="metric-card">
            <div class="metric-header">
              <Edit :size="20" class="text-orange-400" />
              <span class="metric-label">Customized Cards</span>
            </div>
            <div class="metric-value">{{ metrics.usersWhoModifiedCards.toLocaleString() }}</div>
            <div class="metric-change text-zinc-500">
              users modified default cards
            </div>
          </div>

          <!-- Users Who Clicked Install -->
          <div class="metric-card">
            <div class="metric-header">
              <Download :size="20" class="text-cyan-400" />
              <span class="metric-label">Install Views</span>
            </div>
            <div class="metric-value">{{ metrics.usersWhoClickedInstall.toLocaleString() }}</div>
            <div class="metric-change text-zinc-500">
              users clicked install button
            </div>
          </div>
        </div>

        <!-- Second Row: Repeat Users and City Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Repeat Users -->
          <div class="metric-card">
            <div class="metric-header">
              <UserPlus :size="20" class="text-orange-400" />
              <span class="metric-label">Repeat Users</span>
            </div>
            <div class="metric-value">{{ metrics.repeatUsers.toLocaleString() }}</div>
            <div class="metric-change" :class="metrics.repeatUserPercentage >= 30 ? 'text-green-400' : metrics.repeatUserPercentage >= 20 ? 'text-yellow-400' : 'text-zinc-500'">
              {{ metrics.repeatUserPercentage }}% of total users
            </div>
          </div>

          <!-- City Summary -->
          <div class="metric-card">
            <div class="metric-header">
              <Globe :size="20" class="text-cyan-400" />
              <span class="metric-label">Cities Active</span>
            </div>
            <div class="metric-value">{{ metrics.topCities.length }}</div>
            <div class="metric-change text-zinc-500">
              {{ metrics.topCities.length > 0 ? metrics.topCities[0].name : 'No data' }} leading
            </div>
          </div>
        </div>

        <!-- Retention Metric (DAU/MAU) -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp :size="20" class="text-blue-400" />
            Retention (Stickiness)
          </h3>
          <div class="flex items-end gap-6">
            <div>
              <div class="text-4xl font-bold text-white">{{ metrics.retentionRate }}%</div>
              <div class="text-sm text-zinc-500 mt-1">DAU / MAU Ratio</div>
            </div>
            <div class="flex-1">
              <div class="text-sm text-zinc-400 mb-2">
                <span class="text-green-400 font-bold">{{ metrics.dau }}</span> Daily Active Users / 
                <span class="text-blue-400 font-bold">{{ metrics.mau }}</span> Monthly Active Users
              </div>
              <div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  :style="{ width: `${metrics.retentionRate}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div class="mt-4 text-xs text-zinc-500">
            {{ getRetentionStatus(metrics.retentionRate) }}
          </div>
        </div>

        <!-- Growth Chart (Last 30 Days) -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 :size="20" class="text-green-400" />
            New User Growth (Last 30 Days)
          </h3>
          <div class="h-48 flex items-end gap-1">
            <div 
              v-for="(day, index) in metrics.growthData" 
              :key="index"
              class="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition-colors cursor-pointer group relative"
              :style="{ height: `${Math.max((day / metrics.maxDailyGrowth) * 100, 5)}%` }"
              :title="`${day} new users on ${formatChartDate(index)}`"
            >
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {{ day }} users
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-zinc-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <!-- Shift Distribution -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity :size="20" class="text-blue-400" />
            Shift Distribution
          </h3>
          <div class="space-y-3">
            <div v-for="shift in metrics.shiftDistribution" :key="shift.type" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-lg">{{ shift.emoji }}</span>
                <span class="text-zinc-300 font-medium">{{ shift.type }}</span>
              </div>
              <div class="flex items-center gap-3 flex-1 max-w-xs">
                <div class="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    :style="{ width: `${shift.percentage}%` }"
                  ></div>
                </div>
                <span class="text-white font-bold text-sm w-12 text-right">{{ shift.percentage }}%</span>
                <span class="text-zinc-500 text-xs w-16 text-right">({{ shift.count }})</span>
              </div>
            </div>
          </div>
          <div class="mt-4 text-xs text-zinc-500">
            <span class="font-bold text-zinc-400">Insight:</span> {{ getShiftInsight(metrics.shiftDistribution) }}
          </div>
        </div>

        <!-- City Analytics Summary -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe :size="20" class="text-purple-400" />
            City Analytics Summary
          </h3>
          <div v-if="metrics.topCities.length === 0" class="text-zinc-500 text-sm">
            No location data available yet.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div class="text-xs text-zinc-500 uppercase mb-1">Total Cities</div>
              <div class="text-2xl font-bold text-white">{{ metrics.topCities.length }}</div>
              <div class="text-xs text-zinc-600 mt-1">With active users</div>
            </div>
            <div class="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div class="text-xs text-zinc-500 uppercase mb-1">Top City (Users)</div>
              <div class="text-lg font-bold text-white">{{ metrics.topCities[0].name }}</div>
              <div class="text-xs text-zinc-600 mt-1">{{ metrics.topCities[0].users }} users, {{ metrics.topCities[0].sessions }} sessions</div>
            </div>
            <div class="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div class="text-xs text-zinc-500 uppercase mb-1">Most Active City</div>
              <div class="text-lg font-bold text-white">{{ metrics.mostActiveCities[0].name }}</div>
              <div class="text-xs text-zinc-600 mt-1">{{ metrics.mostActiveCities[0].sessions }} sessions, {{ metrics.mostActiveCities[0].users }} users</div>
            </div>
          </div>
        </div>

        <!-- Top Cities by Users -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe :size="20" class="text-purple-400" />
            Top Cities (by Users)
          </h3>
          <div v-if="metrics.topCities.length === 0" class="text-zinc-500 text-sm">
            No location data available yet.
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="(city, index) in metrics.topCities" 
              :key="`top-${city.name}`"
              class="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="text-white font-bold">{{ city.name }}</div>
                  <div class="text-xs text-zinc-500">{{ city.region }}, {{ city.country }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-white font-bold">{{ city.users }}</div>
                <div class="text-xs text-zinc-500">{{ city.sessions }} sessions</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Most Active Cities -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity :size="20" class="text-green-400" />
            Most Active Cities
          </h3>
          <div v-if="metrics.mostActiveCities.length === 0" class="text-zinc-500 text-sm">
            No activity data available yet.
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="(city, index) in metrics.mostActiveCities" 
              :key="`active-${city.name}`"
              class="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-green-800/30"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 font-bold text-sm">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="text-white font-bold">{{ city.name }}</div>
                  <div class="text-xs text-zinc-500">{{ city.region }}, {{ city.country }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-white font-bold">{{ city.sessions }}</div>
                <div class="text-xs text-zinc-500">{{ city.users }} users</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Growing Cities -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp :size="20" class="text-blue-400" />
            Growing Cities
          </h3>
          <div v-if="metrics.growingCities.length === 0" class="text-zinc-500 text-sm">
            No growth data available yet.
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="(city, index) in metrics.growingCities" 
              :key="`growing-${city.name}`"
              class="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-blue-800/30"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="text-white font-bold">{{ city.name }}</div>
                  <div class="text-xs text-zinc-500">{{ city.region }}, {{ city.country }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-green-400 font-bold">+{{ city.growth }}%</div>
                <div class="text-xs text-zinc-500">{{ city.users }} users</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Least Active Cities -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle :size="20" class="text-yellow-400" />
            Least Active Cities
          </h3>
          <div v-if="metrics.leastActiveCities.length === 0" class="text-zinc-500 text-sm">
            No activity data available yet.
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="(city, index) in metrics.leastActiveCities" 
              :key="`least-${city.name}`"
              class="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-yellow-800/30"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-yellow-900/30 flex items-center justify-center text-yellow-400 font-bold text-sm">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="text-white font-bold">{{ city.name }}</div>
                  <div class="text-xs text-zinc-500">{{ city.region }}, {{ city.country }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-yellow-400 font-bold">{{ city.sessions }}</div>
                <div class="text-xs text-zinc-500">{{ city.users }} users</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Peak Usage Times -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 :size="20" class="text-green-400" />
            Peak Usage Times
          </h3>
          <div class="text-zinc-400 text-sm mb-4">
            Most active hours (last 7 days)
          </div>
          <div class="h-32 flex items-end gap-1">
            <div 
              v-for="(hour, index) in metrics.peakHours" 
              :key="index"
              class="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-500 hover:to-green-300 transition-colors cursor-pointer group relative"
              :style="{ height: `${Math.max((hour / metrics.maxHourlyUsage) * 100, 5)}%` }"
              :title="`${index}:00 - ${hour} sessions`"
            >
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {{ hour }} at {{ index }}:00
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-zinc-500">
            <span>0:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
          <div v-if="metrics.peakHour" class="mt-4 text-sm text-zinc-400">
            <span class="font-bold text-white">Peak:</span> {{ metrics.peakHour }}:00 with {{ metrics.peakHourCount }} sessions
          </div>
        </div>
      </div>
    </div>

    <!-- ADS TAB -->
    <div v-if="activeTab === 'ads'" class="p-6 overflow-y-auto flex-1">
      <!-- Create New Ad Form -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h3 class="text-lg font-bold text-white mb-4">Create New Promotion</h3>
        
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
              <select v-model="newAd.type" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300">
                <option value="text">Simple Text</option>
                <option value="affiliate">Affiliate / Banner</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
              <select v-model="newAd.isActive" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300">
                <option :value="true">Active</option>
                <option :value="false">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">
              {{ newAd.type === 'text' ? 'Message Text' : 'Banner Title / Headline' }}
            </label>
            <input v-model="newAd.content" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="e.g. 50% Off Nursing Shoes" />
          </div>

          <div v-if="newAd.type === 'affiliate'">
             <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Image URL (Optional)</label>
             <input v-model="newAd.imageUrl" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="https://example.com/image.jpg" />
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Target Link (URL)</label>
            <input v-model="newAd.link" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="https://amazon.com/..." />
          </div>

          <!-- Targeting Options -->
          <div class="border-t border-zinc-800 pt-4 mt-4">
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-3">Targeting (Optional)</label>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Target City</label>
                <input 
                  v-model="newAd.targetCity" 
                  type="text" 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-sm" 
                  placeholder="e.g. London (leave empty for all)"
                />
                <p class="text-[10px] text-zinc-600 mt-1">Show only in this city</p>
              </div>
              
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Target Region</label>
                <input 
                  v-model="newAd.targetRegion" 
                  type="text" 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-sm" 
                  placeholder="e.g. England (leave empty for all)"
                />
                <p class="text-[10px] text-zinc-600 mt-1">Show only in this region</p>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Target Shift</label>
              <div class="flex flex-wrap gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newAd.targetShifts" 
                    value="Day"
                    class="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-zinc-300">Day</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newAd.targetShifts" 
                    value="SE"
                    class="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-zinc-300">SE</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newAd.targetShifts" 
                    value="SL"
                    class="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-zinc-300">SL</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newAd.targetShifts" 
                    value="Night"
                    class="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-zinc-300">Night</span>
                </label>
              </div>
              <p class="text-[10px] text-zinc-600 mt-2">Leave all unchecked to show to all shifts</p>
            </div>
          </div>

          <button 
            @click="createNewAd" 
            :disabled="isSavingAd"
            class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg mt-4 disabled:opacity-50"
          >
            {{ isSavingAd ? 'Publishing...' : 'Publish Ad' }}
          </button>
        </div>
      </div>

      <!-- Existing Ads List -->
      <h3 class="text-lg font-bold text-white mb-4">All Campaigns</h3>
      <div v-if="loadingAds" class="text-zinc-500">Loading campaigns...</div>
      <div v-else class="space-y-4">
        <div v-for="ad in ads" :key="ad.id" class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span 
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="ad.isActive ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-zinc-800 text-zinc-500'"
              >
                {{ ad.isActive ? 'LIVE' : 'PAUSED' }}
              </span>
              <span class="text-xs text-zinc-500 uppercase">{{ ad.type }}</span>
            </div>
            <h4 class="font-bold text-zinc-200 mb-1">{{ ad.content }}</h4>
            <a :href="ad.link" target="_blank" class="text-xs text-blue-400 hover:underline truncate block max-w-md">{{ ad.link }}</a>
            <div v-if="ad.imageUrl" class="text-xs text-zinc-600 mt-1">Image: {{ ad.imageUrl.substring(0, 40) }}...</div>
            <div v-if="ad.targetCity || ad.targetRegion || (ad.targetShifts && ad.targetShifts.length > 0)" class="mt-2 flex flex-wrap gap-2">
              <span v-if="ad.targetCity" class="text-[10px] px-2 py-0.5 rounded bg-blue-900/20 text-blue-400 border border-blue-900/30">
                📍 {{ ad.targetCity }}
              </span>
              <span v-if="ad.targetRegion" class="text-[10px] px-2 py-0.5 rounded bg-purple-900/20 text-purple-400 border border-purple-900/30">
                🌍 {{ ad.targetRegion }}
              </span>
              <span v-if="ad.targetShifts && ad.targetShifts.length > 0" class="text-[10px] px-2 py-0.5 rounded bg-green-900/20 text-green-400 border border-green-900/30">
                ⏰ {{ ad.targetShifts.join(', ') }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button 
              @click="toggleAdStatus(ad)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Toggle Active Status"
            >
              <Power :size="18" :class="ad.isActive ? 'text-green-400' : 'text-zinc-500'" />
            </button>
            <button 
              @click="deleteAdHandler(ad.id)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-colors"
              title="Delete Campaign"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
        <div v-if="ads.length === 0" class="text-zinc-600 text-sm text-center py-8">
          No ad campaigns found. Create one above.
        </div>
      </div>
    </div>

    <!-- NOTICES TAB -->
    <div v-if="activeTab === 'notices'" class="p-6 overflow-y-auto flex-1">
      <!-- Create New Notice Form -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h3 class="text-lg font-bold text-white mb-4">Create New Notice</h3>
        
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
              <select v-model="newNotice.isActive" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300">
                <option :value="true">Active (Visible to Users)</option>
                <option :value="false">Draft (Hidden)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Priority</label>
              <input v-model.number="newNotice.priority" type="number" min="0" max="10" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="0 (default)" />
              <p class="text-[10px] text-zinc-600 mt-1">Higher priority shows first</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
            <input v-model="newNotice.title" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="e.g. New Update Available" />
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Content</label>
            <textarea v-model="newNotice.content" rows="4" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="Enter the notice message. Users will see this in a popup."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Link URL (Optional)</label>
              <input v-model="newNotice.link" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Link Text (Optional)</label>
              <input v-model="newNotice.linkText" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="Learn More" />
            </div>
          </div>

          <button 
            @click="createNewNotice" 
            :disabled="isSavingNotice"
            class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg mt-4 disabled:opacity-50"
          >
            {{ isSavingNotice ? 'Publishing...' : 'Publish Notice' }}
          </button>
        </div>
      </div>

      <!-- Existing Notices List -->
      <h3 class="text-lg font-bold text-white mb-4">All Notices</h3>
      <div v-if="loadingNotices" class="text-zinc-500">Loading notices...</div>
      <div v-else class="space-y-4">
        <div v-for="notice in notices" :key="notice.id" class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-start group">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span 
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="notice.is_active ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-zinc-800 text-zinc-500'"
              >
                {{ notice.is_active ? 'ACTIVE' : 'DRAFT' }}
              </span>
              <span class="text-xs text-zinc-500">Priority: {{ notice.priority || 0 }}</span>
            </div>
            <h4 class="font-bold text-zinc-200 mb-2">{{ notice.title }}</h4>
            <p class="text-sm text-zinc-400 mb-2 whitespace-pre-line">{{ notice.content }}</p>
            <div v-if="notice.link" class="text-xs text-blue-400">
              <a :href="notice.link" target="_blank" class="hover:underline">{{ notice.link_text || notice.link }}</a>
            </div>
            <div class="text-xs text-zinc-600 mt-2">
              Created: {{ formatNoticeDate(notice.created_at) }}
            </div>
          </div>
          
          <div class="flex items-center gap-2 ml-4">
            <button 
              @click="toggleNoticeStatus(notice)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Toggle Active Status"
            >
              <Power :size="18" :class="notice.is_active ? 'text-green-400' : 'text-zinc-500'" />
            </button>
            <button 
              @click="editNoticeHandler(notice)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Edit Notice"
            >
              <Pencil :size="18" />
            </button>
            <button 
              @click="deleteNoticeHandler(notice.id)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-colors"
              title="Delete Notice"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
        <div v-if="notices.length === 0" class="text-zinc-600 text-sm text-center py-8">
          No notices found. Create one above.
        </div>
      </div>
    </div>

    <!-- TESTING TAB -->
    <div v-if="activeTab === 'testing'" class="p-6 overflow-y-auto flex-1">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Beaker :size="20" class="text-yellow-400" />
          Test Mode Settings
        </h3>
        <p class="text-zinc-400 text-sm mb-6">
          Enable test mode on this device to mark all your future shift logs as "Test Data". 
          These will not affect production metrics and can be bulk deleted.
        </p>

        <div class="flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-6">
          <div>
            <div class="font-bold text-white">Device Test Mode</div>
            <div class="text-xs text-zinc-500">
              Current Status: 
              <span :class="isTestMode ? 'text-green-400' : 'text-zinc-500'">
                {{ isTestMode ? 'ENABLED' : 'DISABLED' }}
              </span>
            </div>
          </div>
          <button 
            @click="toggleTestMode"
            class="px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            :class="isTestMode ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-zinc-800 text-zinc-400'"
          >
            {{ isTestMode ? 'Turn Off' : 'Turn On' }}
          </button>
        </div>

        <div class="border-t border-zinc-800 pt-6">
          <h4 class="font-bold text-red-400 mb-2 text-sm uppercase tracking-wider">Danger Zone</h4>
          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-400">
              Bulk delete all logs marked as "Test Data" (`is_test = true`) from the database.
            </div>
            <button 
              @click="purgeTestDataHandler"
              :disabled="isPurging"
              class="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Trash2 :size="16" />
              {{ isPurging ? 'Purging...' : 'Purge Test Data' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Admin Devices Section -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
        <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Lock :size="20" class="text-blue-400" />
          Admin Activated Devices
        </h3>
        <p class="text-zinc-400 text-sm mb-6">
          View and manage devices that have been granted admin access.
        </p>

        <div v-if="loadingDevices" class="text-zinc-500 text-sm text-center py-4">
          Loading devices...
        </div>
        <div v-else-if="adminDevices.length === 0" class="text-zinc-500 text-sm text-center py-4">
          No admin devices found.
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="device in adminDevices" 
            :key="device.id"
            class="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800"
          >
            <div class="flex-1">
              <div class="text-white font-bold mb-1">
                {{ device.device_name || 'Unknown Device' }}
              </div>
              <div class="text-xs text-zinc-500 mb-1">
                ID: {{ device.device_id.substring(0, 20) }}...
              </div>
              <div class="text-xs text-zinc-500">
                Last used: {{ formatDeviceDate(device.last_used_at) }}
              </div>
              <div class="text-xs text-zinc-400 mt-1 truncate max-w-md">
                {{ device.user_agent }}
              </div>
            </div>
            <button 
              @click="deleteDevice(device.device_id)"
              :disabled="isDeletingDevice === device.device_id"
              class="ml-4 p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 transition-colors disabled:opacity-50"
              title="Remove admin access"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Database, LogOut, Trash2, Power, Users, Activity, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Globe, Lock, Beaker, Pencil, UserPlus, Edit, Download } from 'lucide-vue-next'
import { supabase } from '../supabase'
import { 
  fetchAllShiftLogs,
  fetchAllAds,
  createAd,
  updateAd,
  deleteAd,
  fetchAllAdminDevices,
  deleteAdminDeviceSecure,
  purgeTestData,
  fetchAllNotices,
  createNotice,
  updateNotice,
  deleteNotice
} from '../supabase'

const emit = defineEmits(['close'])

// Logout handler to remove admin device status
const handleLogout = () => {
  if (confirm("Remove admin access from this device? You will need the password to enter next time.")) {
    localStorage.removeItem('digiget_admin_device')
    // Reload to reset state immediately
    window.location.reload()
  }
}

const activeTab = ref('metrics') // 'metrics' or 'ads'

// Metrics Data
const metrics = ref({
  totalUsers: 0,
  newUsersToday: 0,
  repeatUsers: 0,
  repeatUserPercentage: 0,
  dau: 0,
  mau: 0,
  retentionRate: 0,
  completionRate: 0,
  completedSessions: 0,
  totalSessions: 0,
  crashes: 0,
  usersWhoModifiedCards: 0,
  usersWhoClickedInstall: 0,
  growthData: [],
  shiftDistribution: [],
  topCities: [],
  mostActiveCities: [],
  leastActiveCities: [],
  growingCities: [],
  peakHours: [],
  maxHourlyUsage: 1,
  peakHour: null,
  peakHourCount: 0
})
const loadingMetrics = ref(true)

// Ads Data
const ads = ref([])
const loadingAds = ref(true)
const isSavingAd = ref(false)

// Test Mode
const isTestMode = ref(false)
const isPurging = ref(false)

// Polling interval for metrics refresh
const pollingInterval = ref(null)

// Admin Devices
const adminDevices = ref([])
const loadingDevices = ref(false)
const isDeletingDevice = ref(null)

// Notices Data
const notices = ref([])
const loadingNotices = ref(false)
const isSavingNotice = ref(false)
const noticeToEdit = ref(null)

// New Notice Form State
const newNotice = ref({
  title: '',
  content: '',
  link: '',
  linkText: '',
  isActive: true,
  priority: 0
})

// New Ad Form State
const newAd = ref({
  type: 'text',
  content: '',
  link: '',
  imageUrl: '',
  isActive: true,
  targetCity: '',
  targetRegion: '',
  targetShifts: [] // Array of shift types: ['Day', 'SE', 'SL', 'Night']
})

// Calculate Metrics from Logs
const calculateMetrics = (allLogs) => {
  // Filter out test data from metrics calculation
  const productionLogs = allLogs.filter(log => !log.isTest)
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Helper to get date from timestamp (normalize to midnight UTC)
  const getDate = (timestamp) => {
    if (!timestamp) return null
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp)
        return null
      }
      // Normalize to midnight in local timezone
      return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    } catch (e) {
      console.warn('Error parsing timestamp:', timestamp, e)
      return null
    }
  }
  
  // Filter logs by date (using production logs only)
  const todayLogs = productionLogs.filter(log => {
    const logDate = getDate(log.timestamp)
    if (!logDate) return false
    return logDate.getTime() === today.getTime()
  })
  
  const last30DaysLogs = productionLogs.filter(log => {
    const logDate = getDate(log.timestamp)
    if (!logDate) return false
    return logDate >= thirtyDaysAgo
  })
  
  if (import.meta.env.DEV) {
    console.log('📅 Date filtering:', {
      today: today.toISOString(),
      todayLogsCount: todayLogs.length,
      last30DaysLogsCount: last30DaysLogs.length,
      totalProductionLogs: productionLogs.length
    })
  }
  
  // Calculate unique users (from production logs only)
  const allUserIds = new Set(productionLogs.map(log => log.userId).filter(Boolean))
  const todayUserIds = new Set(todayLogs.map(log => log.userId).filter(Boolean))
  const last30DaysUserIds = new Set(last30DaysLogs.map(log => log.userId).filter(Boolean))
  
  // Calculate repeat users (users with more than 1 session)
  const userSessionCounts = new Map()
  productionLogs.forEach(log => {
    if (log.userId) {
      userSessionCounts.set(log.userId, (userSessionCounts.get(log.userId) || 0) + 1)
    }
  })
  const repeatUsers = Array.from(userSessionCounts.values()).filter(count => count > 1).length
  const repeatUserPercentage = allUserIds.size > 0 ? Math.round((repeatUsers / allUserIds.size) * 100) : 0
  
  if (import.meta.env.DEV) {
    console.log('👥 User counts:', {
      totalUsers: allUserIds.size,
      todayUsers: todayUserIds.size,
      last30DaysUsers: last30DaysUserIds.size
    })
  }
  
  // New users today (first time appearing in ALL logs is today)
  // Build map of first appearance date for each user
  const userFirstSeen = new Map()
  productionLogs.forEach(log => {
    if (!log.userId) return
    const logDate = getDate(log.timestamp)
    if (!logDate) return
    
    // Track the earliest date we've seen this user
    if (!userFirstSeen.has(log.userId) || logDate < userFirstSeen.get(log.userId)) {
      userFirstSeen.set(log.userId, logDate)
    }
  })
  
  // Count ALL users whose first appearance date is today
  // This is the correct way: check every user, not just today's users
  let newUsersToday = 0
  const todayTime = today.getTime()
  
  userFirstSeen.forEach((firstSeenDate, userId) => {
    if (firstSeenDate.getTime() === todayTime) {
      newUsersToday++
    }
  })
  
  if (import.meta.env.DEV) {
    const newUserIds = Array.from(userFirstSeen.entries())
      .filter(([_, date]) => date.getTime() === todayTime)
      .map(([id, _]) => id.substring(0, 8) + '...')
    
    console.log('🆕 New users calculation:', {
      newUsersToday,
      totalUsers: allUserIds.size,
      todayUsers: todayUserIds.size,
      userFirstSeenMapSize: userFirstSeen.size,
      todayDate: today.toISOString(),
      sampleNewUserIds: newUserIds.slice(0, 5),
      sampleFirstSeenDates: Array.from(userFirstSeen.entries()).slice(0, 10).map(([id, date]) => ({
        userId: id.substring(0, 8) + '...',
        firstSeen: date.toISOString(),
        isToday: date.getTime() === todayTime
      }))
    })
  }
  
  // Filter out CardModification and InstallButtonClick logs from regular session metrics
  const regularSessionLogs = productionLogs.filter(log => 
    log.shiftType !== 'CardModification' && log.shiftType !== 'InstallButtonClick'
  )
  
  // Session completion (sessions that completed = have itemsChecked)
  const completedSessions = regularSessionLogs.filter(log => log.itemsChecked !== undefined && log.itemsChecked > 0).length
  const totalSessions = regularSessionLogs.length
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
  
  // Count users who modified default cards (shift_type === 'CardModification')
  const cardModificationLogs = productionLogs.filter(log => log.shiftType === 'CardModification')
  const usersWhoModifiedCards = new Set(cardModificationLogs.map(log => log.userId).filter(Boolean)).size
  
  // Count users who clicked install button (shift_type === 'InstallButtonClick')
  const installButtonLogs = productionLogs.filter(log => log.shiftType === 'InstallButtonClick')
  const usersWhoClickedInstall = new Set(installButtonLogs.map(log => log.userId).filter(Boolean)).size
  
  // Growth data (last 30 days)
  const growthMap = new Map()
  last30DaysLogs.forEach(log => {
    const logDate = getDate(log.timestamp)
    if (!logDate) return
    
    const dateKey = logDate.toISOString().split('T')[0]
    if (!growthMap.has(dateKey)) {
      growthMap.set(dateKey, new Set())
    }
    if (log.userId) {
      growthMap.get(dateKey).add(log.userId)
    }
  })
  
  // Build 30-day array
  const growthData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]
    const newUsers = growthMap.get(dateKey) ? Array.from(growthMap.get(dateKey)).filter(userId => {
      const firstSeen = userFirstSeen.get(userId)
      return firstSeen && firstSeen.getTime() === date.getTime()
    }).length : 0
    growthData.push(newUsers)
  }
  
  const maxDailyGrowth = Math.max(...growthData, 1)
  
  // DAU/MAU Retention
  const dau = todayUserIds.size
  const mau = last30DaysUserIds.size
  const retentionRate = mau > 0 ? Math.round((dau / mau) * 100) : 0
  
  // Shift Distribution
  const shiftCounts = { Day: 0, SE: 0, SL: 0, Night: 0 }
  productionLogs.forEach(log => {
    if (log.shiftType && shiftCounts.hasOwnProperty(log.shiftType)) {
      shiftCounts[log.shiftType]++
    } else {
      shiftCounts.Day++ // Default to Day if unknown
    }
  })
  const totalShifts = Object.values(shiftCounts).reduce((a, b) => a + b, 0)
  const shiftDistribution = [
    { type: 'Day', count: shiftCounts.Day, percentage: totalShifts > 0 ? Math.round((shiftCounts.Day / totalShifts) * 100) : 0, emoji: '☀️' },
    { type: 'SE', count: shiftCounts.SE, percentage: totalShifts > 0 ? Math.round((shiftCounts.SE / totalShifts) * 100) : 0, emoji: '🌅' },
    { type: 'SL', count: shiftCounts.SL, percentage: totalShifts > 0 ? Math.round((shiftCounts.SL / totalShifts) * 100) : 0, emoji: '🌆' },
    { type: 'Night', count: shiftCounts.Night, percentage: totalShifts > 0 ? Math.round((shiftCounts.Night / totalShifts) * 100) : 0, emoji: '🌙' }
  ].filter(s => s.count > 0) // Only show shifts that have been used
  
  // City Analytics
  const cityMap = new Map()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  productionLogs.forEach(log => {
    if (log.location && log.location.city && log.location.city !== 'Unknown') {
      const cityKey = `${log.location.city}, ${log.location.region || 'Unknown'}`
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          name: log.location.city,
          region: log.location.region || 'Unknown',
          country: log.location.country || 'Unknown',
          users: new Set(),
          recentUsers: new Set(),
          sessions: 0, // Total sessions/activity
          recentSessions: 0 // Sessions in last 7 days
        })
      }
      const cityData = cityMap.get(cityKey)
      cityData.sessions++ // Count all sessions
      
      const logDate = getDate(log.timestamp)
      if (logDate && logDate >= sevenDaysAgo) {
        cityData.recentSessions++ // Count recent sessions
        if (log.userId) {
          cityData.recentUsers.add(log.userId)
        }
      }
      
      if (log.userId) {
        cityData.users.add(log.userId)
      }
    }
  })
  
  // Calculate metrics for each city
  const allCities = Array.from(cityMap.entries())
    .map(([key, data]) => {
      const userCount = data.users.size
      const recentCount = data.recentUsers.size
      const previousCount = userCount - recentCount
      const growth = previousCount > 0 ? Math.round(((recentCount / previousCount) * 100)) : (recentCount > 0 ? 100 : 0)
      
      return {
        name: data.name,
        region: data.region,
        country: data.country,
        users: userCount,
        sessions: data.sessions,
        growth: growth
      }
    })
  
  // Top Cities (by user count)
  const topCities = [...allCities]
    .sort((a, b) => b.users - a.users)
    .slice(0, 10)
  
  // Most Active Cities (by total sessions/activity)
  const mostActiveCities = [...allCities]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10)
  
  // Least Active Cities (cities with lowest activity, but at least 1 session)
  const leastActiveCities = [...allCities]
    .filter(city => city.sessions > 0) // Only cities with at least 1 session
    .sort((a, b) => a.sessions - b.sessions)
    .slice(0, 10)
  
  // Growing Cities (cities with positive growth, sorted by growth rate)
  const growingCities = [...allCities]
    .filter(city => city.growth > 0 && city.users >= 2) // At least 2 users to show meaningful growth
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 10)
  
  // Peak Usage Times (last 7 days)
  const last7DaysLogs = productionLogs.filter(log => {
    const logDate = getDate(log.timestamp)
    return logDate && logDate >= sevenDaysAgo
  })
  
  const hourlyUsage = new Array(24).fill(0)
  last7DaysLogs.forEach(log => {
    if (log.timestamp) {
      const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp)
      const hour = date.getHours()
      hourlyUsage[hour]++
    }
  })
  
  const maxHourlyUsage = Math.max(...hourlyUsage, 1)
  const peakHourIndex = hourlyUsage.indexOf(maxHourlyUsage)
  const peakHour = peakHourIndex !== -1 ? peakHourIndex : null
  const peakHourCount = maxHourlyUsage
  
  return {
    totalUsers: allUserIds.size,
    newUsersToday,
    repeatUsers,
    repeatUserPercentage,
    dau,
    mau,
    retentionRate,
    completionRate,
    completedSessions,
    totalSessions,
    crashes: 0, // TODO: Track crashes separately
    usersWhoModifiedCards,
    usersWhoClickedInstall,
    growthData,
    maxDailyGrowth,
    shiftDistribution,
    topCities,
    mostActiveCities,
    leastActiveCities,
    growingCities,
    peakHours: hourlyUsage,
    maxHourlyUsage,
    peakHour,
    peakHourCount
  }
}

onMounted(async () => {
  isTestMode.value = localStorage.getItem('digiget_test_mode') === 'true'
  
  // Check if Supabase is configured
  if (!supabase) {
    console.error('❌ Supabase client not initialized')
    loadingMetrics.value = false
    loadingAds.value = false
    alert('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and restart the dev server.')
    return
  }
  
  // Check if VITE_SUPABASE_URL is configured (needed for edge functions)
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('❌ VITE_SUPABASE_URL not configured')
    loadingMetrics.value = false
    loadingAds.value = false
    alert('VITE_SUPABASE_URL is not configured. Edge functions (metrics, ads) will not work. Please set VITE_SUPABASE_URL in your .env file and restart the dev server.')
    return
  }
  
  // Load admin devices (this might fail if edge functions aren't configured, but that's okay)
  try {
    await loadAdminDevices()
  } catch (error) {
    console.warn('⚠️ Could not load admin devices:', error.message)
    // Don't block the rest of the initialization
  }

  // --- 1. Fetch Metrics Logic ---
  const fetchMetrics = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔄 Fetching metrics...')
      }
      
      // Fetch logs via Edge Function (Secure)
      const allLogs = await fetchAllShiftLogs()
      
      if (import.meta.env.DEV) {
        console.log(`✅ Fetched ${allLogs?.length || 0} logs from edge function`)
        if (allLogs && allLogs.length > 0) {
          console.log('📊 Sample log:', allLogs[0])
        }
      }
      
      const convertedLogs = (allLogs || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        itemsChecked: log.items_checked,
        skippedItems: log.skipped_items || [],
        shiftType: log.shift_type,
        location: log.location,
        isTest: log.is_test || false,
        timestamp: log.created_at || null
      }))
      
      if (import.meta.env.DEV) {
        console.log(`✅ Converted ${convertedLogs.length} logs for metrics calculation`)
      }
      
      const calculatedMetrics = calculateMetrics(convertedLogs)
      metrics.value = calculatedMetrics
      
      if (import.meta.env.DEV) {
        console.log('📈 Calculated metrics:', {
          totalUsers: calculatedMetrics.totalUsers,
          newUsersToday: calculatedMetrics.newUsersToday,
          dau: calculatedMetrics.dau,
          mau: calculatedMetrics.mau,
          totalSessions: calculatedMetrics.totalSessions
        })
      }
      
      loadingMetrics.value = false
    } catch (error) {
      console.error("❌ Metrics Sync Error:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      // Don't alert on polling errors to avoid spamming the admin
      if (loadingMetrics.value) {
        alert(`Failed to load metrics: ${error.message}. Check console for details.`)
        loadingMetrics.value = false
      }
    }
  }

  // Initial Fetch
  await fetchMetrics()

  // ✅ NEW: Poll every 30 seconds instead of using Realtime
  // Realtime subscriptions are blocked by RLS for security, so we poll the Edge Function.
  pollingInterval.value = setInterval(fetchMetrics, 30000)

  // --- 2. Fetch Ads Logic ---
  try {
    const adsData = await fetchAllAds()
    ads.value = (adsData || []).map(ad => ({
      id: ad.id,
      type: ad.type,
      content: ad.content,
      link: ad.link,
      imageUrl: ad.image_url || ad.imageUrl,
      isActive: ad.is_active !== undefined ? ad.is_active : ad.isActive,
      targetCity: ad.target_city || ad.targetCity,
      targetRegion: ad.target_region || ad.targetRegion,
      targetShifts: ad.target_shifts || ad.targetShifts || [],
      createdAt: ad.created_at ? { seconds: Math.floor(new Date(ad.created_at).getTime() / 1000) } : null
    }))
    loadingAds.value = false
  } catch (error) {
    console.error("Ads Access Error:", error)
    loadingAds.value = false
  }

  // --- 3. Fetch Notices Logic ---
  await loadNotices()
})

// Clean up interval on destroy
onUnmounted(() => {
  if (pollingInterval.value) clearInterval(pollingInterval.value)
})

// --- Test Mode Actions ---
const toggleTestMode = () => {
  isTestMode.value = !isTestMode.value
  localStorage.setItem('digiget_test_mode', isTestMode.value.toString())
  // Force reload to apply the "Test Mode" banner in App.vue
  window.location.reload()
}

// Load metrics function (can be called to refresh)
const loadMetrics = async () => {
  loadingMetrics.value = true
  try {
    const allLogs = await fetchAllShiftLogs()
    
    if (import.meta.env.DEV) {
      console.log(`✅ Refreshing metrics: Fetched ${allLogs?.length || 0} logs`)
    }
    
    const convertedLogs = (allLogs || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      itemsChecked: log.items_checked,
      skippedItems: log.skipped_items || [],
      shiftType: log.shift_type,
      location: log.location,
      isTest: log.is_test || false,
      timestamp: log.created_at || null
    }))
    
    metrics.value = calculateMetrics(convertedLogs)
    loadingMetrics.value = false
  } catch (error) {
    console.error("❌ Error loading metrics:", error)
    loadingMetrics.value = false
  }
}

const purgeTestDataHandler = async () => {
  if (!confirm("Are you sure? This will delete ALL logs marked as 'is_test = true' from the database. This cannot be undone.")) return

  isPurging.value = true
  try {
    const result = await purgeTestData()
    if (result.error) {
      throw new Error(result.error)
    }
    alert(`Successfully deleted ${result.deleted_count || 0} test records.`)
    // Refetch metrics after purge
    await loadMetrics()
  } catch (e) {
    console.error("Purge error:", e)
    alert("Failed to delete data. Check console.")
  } finally {
    isPurging.value = false
  }
}

// --- Admin Devices Actions ---
const loadAdminDevices = async () => {
  loadingDevices.value = true
  try {
    const devices = await fetchAllAdminDevices()
    adminDevices.value = devices
  } catch (e) {
    console.error("Error loading admin devices:", e)
  } finally {
    loadingDevices.value = false
  }
}

const deleteDevice = async (deviceId) => {
  if (!confirm("Remove admin access from this device? The device will need to enter the password next time.")) return

  isDeletingDevice.value = deviceId
  try {
    const result = await deleteAdminDeviceSecure(deviceId)
    if (result.success) {
      // Remove from local list
      adminDevices.value = adminDevices.value.filter(d => d.device_id !== deviceId)
      alert("Device removed successfully.")
    } else {
      alert(`Failed to remove device: ${result.message}`)
    }
  } catch (e) {
    console.error("Error deleting device:", e)
    alert("Failed to remove device. Check console.")
  } finally {
    isDeletingDevice.value = null
  }
}

const formatDeviceDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// --- Ad Actions ---

const createNewAd = async () => {
  if (!newAd.value.content || !newAd.value.link) {
    alert("Please fill in Content and Link fields.")
    return
  }

  isSavingAd.value = true
  try {
    const result = await createAd({
      type: newAd.value.type,
      content: newAd.value.content,
      link: newAd.value.link,
      image_url: newAd.value.imageUrl || null,
      is_active: newAd.value.isActive,
      target_city: newAd.value.targetCity || null,
      target_region: newAd.value.targetRegion || null,
      target_shifts: newAd.value.targetShifts || []
    })
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Reset Form
    newAd.value = {
      type: 'text',
      content: '',
      link: '',
      imageUrl: '',
      isActive: true,
      targetCity: '',
      targetRegion: '',
      targetShifts: []
    }
    
    // Refetch ads
    const updatedAds = await fetchAllAds()
    if (updatedAds) {
      ads.value = updatedAds.map(ad => ({
        id: ad.id,
        type: ad.type,
        content: ad.content,
        link: ad.link,
        imageUrl: ad.image_url || ad.imageUrl,
        isActive: ad.is_active !== undefined ? ad.is_active : ad.isActive,
        targetCity: ad.target_city || ad.targetCity,
        targetRegion: ad.target_region || ad.targetRegion,
        targetShifts: ad.target_shifts || ad.targetShifts || [],
        createdAt: ad.created_at ? { seconds: Math.floor(new Date(ad.created_at).getTime() / 1000) } : null
      }))
    }
    
    alert("Campaign published successfully.")
  } catch (e) {
    console.error("Error creating ad:", e)
    alert("Failed to publish ad. Check console.")
  } finally {
    isSavingAd.value = false
  }
}

const toggleAdStatus = async (ad) => {
  try {
    const result = await updateAd(ad.id, { is_active: !ad.isActive })
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Update local state
    const adIndex = ads.value.findIndex(a => a.id === ad.id)
    if (adIndex !== -1) {
      ads.value[adIndex].isActive = !ad.isActive
    }
  } catch (e) {
    console.error("Error toggling ad:", e)
  }
}

const deleteAdHandler = async (id) => {
  if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) return
  try {
    const result = await deleteAd(id)
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Remove from local state
    ads.value = ads.value.filter(ad => ad.id !== id)
    alert("Campaign deleted successfully.")
  } catch (e) {
    console.error("Error deleting ad:", e)
    alert("Failed to delete campaign. Check console for details.")
  }
}

// Formatters
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

const formatNoticeDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatChartDate = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - daysAgo))
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

const getEngagementClass = (dau) => {
  if (dau >= 100) return 'text-green-400'
  if (dau >= 50) return 'text-yellow-400'
  return 'text-zinc-500'
}

const getEngagementText = (dau) => {
  if (dau >= 100) return 'High engagement!'
  if (dau >= 50) return 'Good engagement'
  return 'Low engagement'
}

const getRetentionStatus = (rate) => {
  if (rate >= 50) return 'Excellent retention! Users are coming back regularly.'
  if (rate >= 30) return 'Good retention. Room for improvement.'
  if (rate >= 20) return 'Moderate retention. Consider improving user experience.'
  return 'Low retention. Investigate why users aren\'t returning.'
}

const getShiftInsight = (shiftDist) => {
  if (shiftDist.length === 0) return 'No shift data available yet.'
  
  const topShift = shiftDist[0]
  const nightShift = shiftDist.find(s => s.type === 'Night')
  
  if (nightShift && nightShift.percentage >= 50) {
    return `Night shift nurses use the app ${Math.round(nightShift.percentage / 20)}x more than other shifts. Consider adding night-specific features.`
  }
  
  if (topShift.percentage >= 60) {
    return `${topShift.type} shift is dominant (${topShift.percentage}%). Focus marketing on ${topShift.type} shift nurses.`
  }
  
  return `Usage is distributed across shifts. ${topShift.type} shift leads with ${topShift.percentage}%.`
}

// --- Notice Actions ---
const loadNotices = async () => {
  loadingNotices.value = true
  try {
    const noticesData = await fetchAllNotices()
    notices.value = noticesData || []
  } catch (e) {
    console.error("Error loading notices:", e)
  } finally {
    loadingNotices.value = false
  }
}

const createNewNotice = async () => {
  if (!newNotice.value.title || !newNotice.value.content) {
    alert("Please fill in Title and Content fields.")
    return
  }

  isSavingNotice.value = true
  try {
    const result = await createNotice({
      title: newNotice.value.title,
      content: newNotice.value.content,
      link: newNotice.value.link || null,
      link_text: newNotice.value.linkText || null,
      is_active: newNotice.value.isActive,
      priority: newNotice.value.priority || 0
    })
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Reset Form
    newNotice.value = {
      title: '',
      content: '',
      link: '',
      linkText: '',
      isActive: true,
      priority: 0
    }
    
    // Reload notices
    await loadNotices()
    
    alert("Notice published successfully.")
  } catch (e) {
    console.error("Error creating notice:", e)
    alert("Failed to publish notice. Check console.")
  } finally {
    isSavingNotice.value = false
  }
}

const toggleNoticeStatus = async (notice) => {
  try {
    const result = await updateNotice(notice.id, { is_active: !notice.is_active })
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Update local state
    const noticeIndex = notices.value.findIndex(n => n.id === notice.id)
    if (noticeIndex !== -1) {
      notices.value[noticeIndex].is_active = !notice.is_active
    }
  } catch (e) {
    console.error("Error toggling notice:", e)
    alert("Failed to update notice. Check console.")
  }
}

const editNoticeHandler = (notice) => {
  noticeToEdit.value = notice
  newNotice.value = {
    title: notice.title,
    content: notice.content,
    link: notice.link || '',
    linkText: notice.link_text || '',
    isActive: notice.is_active,
    priority: notice.priority || 0
  }
  // Scroll to top to show the form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteNoticeHandler = async (noticeId) => {
  if (!confirm("Are you sure you want to delete this notice? This cannot be undone.")) return
  try {
    const result = await deleteNotice(noticeId)
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Remove from local state
    notices.value = notices.value.filter(n => n.id !== noticeId)
    alert("Notice deleted successfully.")
  } catch (e) {
    console.error("Error deleting notice:", e)
    alert("Failed to delete notice. Check console for details.")
  }
}
</script>

<style scoped>
.admin-dashboard {
  @apply fixed inset-0 bg-zinc-950 z-[100] flex flex-col;
  animation: fadeIn 0.3s ease-out;
}

.dashboard-header {
  @apply flex justify-between items-start p-6 border-b border-zinc-900 bg-zinc-950;
}

.exit-btn {
  @apply p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors;
}

.table-container {
  @apply flex-1 overflow-auto;
}

.modal-backdrop {
  @apply fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4;
}

.modal-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Metrics Card Styles */
.metric-card {
  @apply bg-zinc-900 border border-zinc-800 rounded-xl p-6;
}

.metric-header {
  @apply flex items-center gap-2 mb-3;
}

.metric-label {
  @apply text-xs font-bold text-zinc-500 uppercase tracking-wider;
}

.metric-value {
  @apply text-3xl font-bold text-white mb-1;
}

.metric-change {
  @apply text-sm font-medium;
}
</style>
