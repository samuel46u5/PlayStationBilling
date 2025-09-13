// Tab Lock Mechanism untuk mencegah race condition multi-tab
// Menggunakan BroadcastChannel dan localStorage untuk koordinasi antar tab

class TabLockManager {
  private channel: BroadcastChannel;
  private isLeader: boolean = false;
  private leaderId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 detik
  private readonly LEADER_TIMEOUT = 10000; // 10 detik

  constructor() {
    this.leaderId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.channel = new BroadcastChannel('member_card_billing');
    this.initialize();
  }

  private initialize() {
    // Cek apakah ada leader aktif
    const currentLeader = localStorage.getItem('member_card_leader');
    const leaderTimestamp = localStorage.getItem('member_card_leader_timestamp');
    
    if (currentLeader && leaderTimestamp) {
      const timeDiff = Date.now() - parseInt(leaderTimestamp);
      if (timeDiff < this.LEADER_TIMEOUT) {
        // Ada leader aktif, jadi follower
        this.isLeader = false;
      } else {
        // Leader timeout, jadi leader baru
        this.becomeLeader();
      }
    } else {
      // Tidak ada leader, jadi leader
      this.becomeLeader();
    }

    // Listen untuk perubahan leader
    this.channel.addEventListener('message', (event) => {
      if (event.data.type === 'leader_change') {
        this.handleLeaderChange(event.data);
      }
    });

    // Listen untuk window close/refresh
    window.addEventListener('beforeunload', () => {
      this.releaseLeadership();
    });
  }

  private becomeLeader() {
    this.isLeader = true;
    localStorage.setItem('member_card_leader', this.leaderId);
    localStorage.setItem('member_card_leader_timestamp', Date.now().toString());
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Broadcast perubahan leader
    this.channel.postMessage({
      type: 'leader_change',
      leaderId: this.leaderId,
      timestamp: Date.now()
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        localStorage.setItem('member_card_leader_timestamp', Date.now().toString());
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private handleLeaderChange(data: any) {
    if (data.leaderId !== this.leaderId) {
      this.isLeader = false;
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }

  private releaseLeadership() {
    if (this.isLeader) {
      localStorage.removeItem('member_card_leader');
      localStorage.removeItem('member_card_leader_timestamp');
      
      this.channel.postMessage({
        type: 'leader_released',
        leaderId: this.leaderId,
        timestamp: Date.now()
      });
    }
  }

  public isCurrentLeader(): boolean {
    // Double check dengan localStorage
    const currentLeader = localStorage.getItem('member_card_leader');
    const leaderTimestamp = localStorage.getItem('member_card_leader_timestamp');
    
    if (currentLeader === this.leaderId && leaderTimestamp) {
      const timeDiff = Date.now() - parseInt(leaderTimestamp);
      if (timeDiff < this.LEADER_TIMEOUT) {
        return true;
      }
    }
    
    return false;
  }

  public destroy() {
    this.releaseLeadership();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.channel.close();
  }
}

// Singleton instance
let tabLockManager: TabLockManager | null = null;

export const getTabLockManager = (): TabLockManager => {
  if (!tabLockManager) {
    tabLockManager = new TabLockManager();
  }
  return tabLockManager;
};

export const destroyTabLockManager = () => {
  if (tabLockManager) {
    tabLockManager.destroy();
    tabLockManager = null;
  }
};

