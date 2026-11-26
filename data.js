/* MOCK DATA — replace with real sources (Steam/Heroic/Lutris libraries, MPD, etc.) */
window.Data = (() => {
  const h = n => Date.now() - n * 36e5;
  return {
    games: [
      {id:101,n:'Ashfall Drift',genre:'Racing',hrs:42,size:18,last:h(2),fav:1,d:'Arcade rally across volcanic highlands.'},
      {id:102,n:'Hollow Meridian',genre:'Action RPG',hrs:118,size:64,last:h(26),fav:1,d:'A fading empire, a broken compass, one long road.'},
      {id:103,n:'Pale Harbor',genre:'Adventure',hrs:12,size:9,last:h(70),d:'Investigate a fishing town that keeps losing its tide.'},
      {id:104,n:'Neon Ledger',genre:'Strategy',hrs:67,size:6,last:h(140),d:'Run a night market economy, one favour at a time.'},
      {id:105,n:'Starling Run',genre:'Platformer',hrs:9,size:2,last:h(300),d:'Fast, small and very forgiving.'},
      {id:106,n:'Iron Orchard',genre:'Action RPG',hrs:31,size:41,last:h(500),d:'Defend the last grove with clockwork and fire.'},
      {id:107,n:'Tidebreaker',genre:'Adventure',hrs:4,size:22,last:h(900),d:'Sail, salvage, survive.'},
      {id:108,n:'Low Orbit Chess',genre:'Strategy',hrs:88,size:1,last:h(40),fav:1,d:'Chess with gravity. Mind the debris.'}
    ],
    tracks: [['Static Weather','Lowlight',212],['Harbour Lamps','Ione Vale',187],['Rain Over Concrete','Kestrel',264],['Slow Signal','Lowlight',198],['Paper Moons','Ione Vale',241]],
    videos: [['Gameplay capture 14 Nov','12:08'],['Hollow Meridian trailer','2:31'],['Family holiday 2025','46:20']],
    images: [['Screenshot 0412','1920×1080'],['Screenshot 0413','1920×1080'],['Wallpaper — dusk','3840×2160'],['Profile picture','512×512']],
    friends: [['Marlowe','In game · Neon Ledger'],['Priya','Online'],['Tobias','Away'],['Juno','Offline'],['Sam','Offline']],
    msgs: [{f:'Marlowe',txt:'Rematch tonight? I have a new opening.',read:0},{f:'Priya',txt:'Sent you the save file.',read:0},{f:'MONSOON',txt:'Welcome. This is a prototype build.',read:1}],
    ach: [{n:'First Mile',pct:100,d:'Finish a race in Ashfall Drift'},{n:'Cartographer',pct:64,d:'Reveal 80% of the Hollow Meridian map'},{n:'Night Owl',pct:100,d:'Play after 2 a.m.'},{n:'Grand Master',pct:30,d:'Win 50 games of Low Orbit Chess'},{n:'Collector',pct:80,d:'Own 10 games'}],
    dl: [{n:'Hollow Meridian — update 1.4',size:6.2,p:41,rate:38,st:'queued'},{n:'Tidebreaker — DLC',size:3.1,p:0,rate:38,st:'queued'},{n:'Starling Run — patch',size:0.4,p:12,rate:38,st:'paused'}],
    done: [{n:'Iron Orchard — update',when:'Yesterday'},{n:'Pale Harbor',when:'3 days ago'},{n:'Neon Ledger — update',when:'Last week'}],
    feed: [['Download finished: Iron Orchard update','downloads'],['Marlowe is playing Neon Ledger','social'],['Achievement unlocked: Night Owl','social'],['New message from Priya','social']]
  };
})();
