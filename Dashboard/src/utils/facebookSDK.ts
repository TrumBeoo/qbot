// src/utils/facebookSDK.js
let isSDKLoaded = false;

export const loadFacebookSDK = (): Promise<FacebookSdk> => {
  // Kieu tra ve ro rang: khong co no thi Promise la unknown va moi cho
  // goi FB.login() deu bao loi.
  return new Promise<FacebookSdk>((resolve, reject) => {
    if (isSDKLoaded) {
      resolve(window.FB);
      return;
    }

    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    
    if (!facebookAppId || facebookAppId === 'your_facebook_app_id') {
      reject(new Error('Facebook App ID not configured'));
      return;
    }

    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      
      isSDKLoaded = true;
      resolve(window.FB);
    };

    // Load the SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/vi_VN/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!isSDKLoaded) {
        reject(new Error('Facebook SDK load timeout'));
      }
    }, 10000);
  });
};