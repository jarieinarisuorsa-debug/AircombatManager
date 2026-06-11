export async function initializeAdMob() {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
    console.log("AdMob: Not running on a native platform, skipping initialization.");
    return false;
  }
  try {
    const { AdMob } = window.Capacitor.Plugins;
    await AdMob.initialize({});
    console.log("AdMob initialized");
    return true;
  } catch (err) {
    console.error("AdMob init failed", err);
    return false;
  }
}

export async function showRewardedAd(onRewardCallback) {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
    console.log("AdMob: Not running natively. Simulating reward.");
    if (onRewardCallback) onRewardCallback();
    return;
  }
  
  try {
    const { AdMob } = window.Capacitor.Plugins;
    // Oikea mainosyksikön tunnus:
    const adId = "ca-app-pub-9256662190629396/7845036273";
    
    // Tyhjennetään mahdolliset vanhat kuuntelijat
    await AdMob.removeAllListeners();

    // Kuunnellaan, kun mainos on ladattu
    AdMob.addListener('onRewardedVideoAdLoaded', async () => {
      console.log("Rewarded ad loaded. Showing it now...");
      await AdMob.showRewardVideoAd();
    });

    // Kuunnellaan, kun käyttäjä on ansainnut palkinnon
    AdMob.addListener('onRewardedVideoAdRewarded', (rewardItem) => {
      console.log("Rewarded ad reward item", rewardItem);
      if (onRewardCallback) onRewardCallback();
    });

    // Kuunnellaan, kun mainos suljetaan
    AdMob.addListener('onRewardedVideoAdDismissed', () => {
      console.log("Rewarded ad dismissed");
      AdMob.removeAllListeners();
    });

    // Kuunnellaan virheitä
    AdMob.addListener('onRewardedVideoAdFailedToLoad', (err) => {
      console.error("Rewarded ad failed to load", err);
      AdMob.removeAllListeners();
    });

    console.log("Loading rewarded ad...");
    // Valmistellaan mainos (testitila pois päältä, virallinen mainos käyttöön)
    await AdMob.prepareRewardVideoAd({ adId: adId, isTesting: false });
    
  } catch (err) {
    console.error("Failed to show rewarded ad", err);
  }
}
