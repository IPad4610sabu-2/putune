const {
  fetcher,
  INNERTUBE,
  wiki,
  musicInfo,
  modules,
  version,
  initlog,
  init,
} = require("../libpoketube-initsys.js");
const {
  IsJsonString,
  convert,
  getFirstLine,
  capitalizeFirstLetter,
  turntomins,
  getRandomInt,
  escapeHtml,
  getRandomArbitrary,
} = require("../ptutils/libpt-coreutils.js");
const media_proxy = require("../libpoketube-video.js");
const atmos = require("../../../pokeatmosurls.json");
const config = require("../../../config.json");

function linkify(text) {
  // regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.replace(urlRegex, (url) => {
    // wrap the URL in an <a> tag with the URL as the href attribute
    return `<a href="/api/redirect?u=${btoa(
      url
        .replace(/twitter\.com/g, "nitter.net")
        .replace(/reddit\.com/g, "teddit.net")
        .replace("https://youtube.com", "")
        .replace("https://youtu.be", "")
    )}" target="_blank">${url}</a>`;
  });
}

function channelurlfixer(text) {
  // Create a regular expression to match <a> tags with href containing "/channel/"
  const regex = /<a\s+href="\/channel\/([^"]+)"/g;
  // Replace matching <a> tags with the modified href attribute
  const updatedDescription = text.replace(regex, '<a href="/channel?id=$1"');
  return updatedDescription;
}

function endsWithYouTubeAutoGenerated(text) {
  const target = " Auto-generated by YouTube. ";
  return text.endsWith(target);
}

const sha384 = modules.hash;
const fetch = modules.fetch;
const htmlToText = require("html-to-text");
const encoding = require("encoding");
const delim1 =
  '</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">';
const delim2 =
  '</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">';
const url = "https://www.google.com/search?q=";

async function lyricsFinder(e = "", d = "") {
  let i;
  try {
    i = await fetch(`${url}${encodeURIComponent(d + " " + e)}+lyrics`);
    i = await i.textConverted();
    [, i] = i.split(delim1);
    [i] = i.split(delim2);
  } catch (m) {
    try {
      i = await fetch(`${url}${encodeURIComponent(d + " " + e)}+song+lyrics`);
      i = await i.textConverted();
      [, i] = i.split(delim1);
      [i] = i.split(delim2);
    } catch (n) {
      try {
        i = await fetch(`${url}${encodeURIComponent(d + " " + e)}+song`);
        i = await i.textConverted();
        [, i] = i.split(delim1);
        [i] = i.split(delim2);
      } catch (o) {
        try {
          i = await fetch(`${url}${encodeURIComponent(d + " " + e)}`);
          i = await i.textConverted();
          [, i] = i.split(delim1);
          [i] = i.split(delim2);
        } catch (p) {
          i = "";
        }
      }
    }
  }
  const ret = i.split("\n");
  let final = "";
  for (let j = 0; j < ret.length; j += 1) {
    final = `${final}${htmlToText.fromString(ret[j])}\n`;
  }
  return String(encoding.convert(final)).trim();
}

function toObject(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i) if (arr[i] !== undefined) rv[i] = arr[i];
  return rv;
}

function lightOrDark(color) {
  // Variables for red, green, blue values
  var r, g, b, hsp;

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If RGB --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If hex --> Convert it to RGB: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return "light";
  } else {
    return "dark";
  }
}

function isDntEnabled(req) {
  const dntHeader = req.header("DNT");
  return dntHeader && (dntHeader === "1" || dntHeader === "true");
}

function IsInArray(array, id) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].id === id) return true;
  }
  return false;
}

function getJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return false;
  }
}

/* support button */
const PATREON_REGEX = /https:\/\/(?:www\.)?patreon.com\/(?<name>[\w\d_-]+)/;

/* connections */
const TWITTER_REGEX = /https:\/\/twitter.com\/(?<name>[\w\d_-]+)/;
const CORD_REGEX = /https:\/\/discord.gg\/(?<name>[\w\d_-]+)/;
const TWITCH_REGEX = /https:\/\/twitch.tv\/(?<name>[\w\d_-]+)/;
const REDDIT_REGEX = /https:\/\/reddit\.com\/r\/(?<name>[\w\d_-]+)/;

/* meta software */
const INSTAGRAM_REGEX = /https:\/\/www.instagram.com\/(?<name>[\w\d_-]+)/;
const THREADS_BY_INSTAGRAM_REGEX = /https:\/\/www.threads.net\/(?<name>[\w\d_-]+)/;
const FACEBOOK_REGEX = /https:\/\/www.facebook.com\/(?<name>[\w\d_-]+)/;

/* music */
const LNKTO_REGEX = /https:\/\/(?<subdomain>\w+).lnk.to\/(?<path>\S*)/;

module.exports = function (app, config, renderTemplate) {
  app.get("/encryption", async function (req, res) {
    res.json("error in parsing");
  });

  app.get("/old", function (req, res) {
    const v = req.query.v;

    renderTemplate(res, req, "poketube-old.ejs", {
      v,
    });
  });

  app.get("/watch", async (req, res) => {
    const { dm, region, hl, v, e, r, f, m, quality: q, a, universe, } = req.query; 

    if (!v) {
      return res.redirect("/");
    }

    const regex = new RegExp("^([a-zA-Z0-9_-]{11})");
    const isMatch = regex.test(v);

    if (!isMatch) {
      return res.redirect("/");
    }

    var contentlang = hl || "en-US";
    var contentregion = region || "US";

    const isVideoValid = await INNERTUBE.isvalidvideo(v);
    if (!isVideoValid) {
      return res.redirect("/?fromerror=21_video_not_valid");
    }

    const u = await media_proxy(v);

    const secure = ["poketube.fun"].includes(req.hostname);
    const verify = req.hostname === "poketube.sudovanilla.com";

    
    INNERTUBE.getYouTubeApiVideo(f, v, contentlang, contentregion).then(
      (data) => {
        try {
          const k = data?.video;
          const channel_uploads = data?.channel_uploads;
          const json = data?.json;
          const engagement = data?.engagement;
          const inv_comments = data?.comments || "Disabled";
          const inv_vid = data?.vid;
          const desc = data?.desc || "";

 
          let d = false;
          if (desc !== "[object Object]") {
            d = desc.toString().replace(/\n/g, " <br> ");
          }

          const descriptionString = String(inv_vid?.description).replace(/\bx.com\b/, "twitter.com")

          function extractInfo(regex) {
            return descriptionString !== "[object Object]"
              ? (regex.exec(descriptionString) ?? {}).groups
              : undefined;
          }

          const support = extractInfo(PATREON_REGEX);
          const STUPID_ELON_MUSK_WEBSITE_HE_IS_TRYING_TO_CALL_IT_X_FOR_SOME_REASON_WHICH_IS_A_STUPID_NAME_WE_WILL_FOREVER_CALL_IT_TWITTER_AND_HE_CAN_DO_NOTHING_ABOUT_IT_LOL_FUCK_YOU_ELON_TRANS_RIGHTS_BTW = extractInfo(TWITTER_REGEX);
          const linkto = extractInfo(LNKTO_REGEX);
          const discord = extractInfo(CORD_REGEX);
          const twitch = extractInfo(TWITCH_REGEX);
          const reddit = extractInfo(REDDIT_REGEX);
          
          /* meta software */
          const instagram = extractInfo(INSTAGRAM_REGEX);
          const threads_by_instagram = extractInfo(THREADS_BY_INSTAGRAM_REGEX);

          const videoObject = inv_vid?.adaptiveFormats;
          function findItag(adaptiveFormats) {
          return;
          }
          
          const itag_hd = findItag(videoObject);
          var proxyurl = config.p_url;
          var vidurl = u.url;
          var isvidious = u.isInvidiousURL;
          var mediaproxy = config.media_proxy;

          if (inv_vid?.genre === "Music") {
            var vidurl = u.losslessurl;
          }

          var vidurl = config.videourl;
          var isvidious = true;

          if (req.useragent.source.includes("Pardus")) {
            var vidurl = "https://iv.ggtyler.dev";
            var mediaproxy = "https://nyc1.pokejan.ggtyler.dev/";
            var isvidious = true;
            var isSchoolProxy = "";
          }

          // unused
          let badges = "";
          let comments = "";
          let nnn = "";

          const dnt_val = isDntEnabled(req);

          if (
            inv_vid?.error ===
              "The uploader has not made this video available in your country" ||
            inv_vid?.error === "This video is not available"
          ) {
            res.send(
              "error: " + inv_vid.error + " please refresh the page please qt"
            );
          }

          if (inv_vid?.error) {
            renderTemplate(res, req, "404.ejs", {
              v,
            });
          }

          var uaos = req.useragent.os;
          const browser = req.useragent.browser;
          const IsOldWindows =
            (uaos === "Windows 7" || uaos === "Windows 8") &&
            browser === "Firefox";

          if (uaos === "Windows XP" || uaos === "Windows Vista")
            res.redirect("/lite?v=" + req.query.v);
          
          if (req.useragent.source.includes("Nintendo WiiU")) 
            res.redirect("/lite?v=" + req.query.v);


          if (req.query.from === "short") var shortsui = true;

          try {
            renderTemplate(res, req, "poketube.ejs", {
              color: data.color,
              color2: data.color2,
              linkify,
              engagement,
              linkto,
              IsOldWindows,
              channelurlfixer,
              itag_hd,
              support,
              shortsui,
              u: vidurl,
              isvidious: isvidious,
              video: json,
              date: k.Video.uploadDate,
              e,
              a,
              twitter:STUPID_ELON_MUSK_WEBSITE_HE_IS_TRYING_TO_CALL_IT_X_FOR_SOME_REASON_WHICH_IS_A_STUPID_NAME_WE_WILL_FOREVER_CALL_IT_TWITTER_AND_HE_CAN_DO_NOTHING_ABOUT_IT_LOL_FUCK_YOU_ELON_TRANS_RIGHTS_BTW,
              k,
              dm,
              proxyurl,
              media_proxy_url: mediaproxy,
              instagram,
              useragent: req.useragent,
              verify,
              discord,
              turntomins,
              twitch,
              dnt_val,
              reddit,
              channel_uploads,
              secure,
              process,
              isSchoolProxy,
              sha384,
              lightOrDark,
              isMobile: req.useragent.isMobile,
              tj: data.channel,
              r,
              threads:threads_by_instagram,
              qua: q,
              inv: inv_comments,
              convert,
              universe,
              wiki: data.wiki,
              escapeHtml,
              f,
              t: config.t_url,
              optout: m,
              badges,
              desc,
              comments,
              n: nnn,
              inv_vid,
              lyrics: "",
            });
          } catch (err) {
              renderTemplate(res, req, "video-error.ejs", {
              v,
              err_reason:err;
            });
          }
        } catch (error) {
          console.error(error);
          return res.redirect(`/watch?v=${req.query.v}&fx=1&err=${error}`);
        }
      }
    );
  });

  app.get("/lite", async (req, res) => {
    const { dm, region, hl, v, e, r, f, m, quality: q, a, universe, } = req.query; 

    if (!v) {
      return res.redirect("/");
    }

    var contentlang = hl || "en-US";
    var contentregion = region || "US";

    const isVideoValid = await INNERTUBE.isvalidvideo(v);
    if (!isVideoValid) {
      return res.redirect("/?fromerror=21_video_not_valid");
    }

    const u = await media_proxy(v);

    const secure = ["poketube.fun"].includes(req.hostname);
    const verify = req.hostname === "poketube.sudovanilla.com";

    INNERTUBE.getYouTubeApiVideo(f, v, contentlang, contentregion).then(
      (data) => {
        try {
          const k = data?.video;
          const channel_uploads = data?.channel_uploads;
          const json = data?.json;
          const engagement = data?.engagement;
          const inv_comments = data?.comments || "Disabled";
          const inv_vid = data?.vid;
          const desc = data?.desc || "";

          let d = false;
          if (desc !== "[object Object]") {
            d = desc.toString().replace(/\n/g, " <br> ");
          }

          const descriptionString = String(inv_vid?.description);

          function extractInfo(regex) {
            return descriptionString !== "[object Object]"
              ? (regex.exec(descriptionString) ?? {}).groups
              : undefined;
          }

          const support = extractInfo(PATREON_REGEX);
          const twitter = extractInfo(TWITTER_REGEX);
          const discord = extractInfo(CORD_REGEX);
          const twitch = extractInfo(TWITCH_REGEX);
          const reddit = extractInfo(REDDIT_REGEX);
          const instagram = extractInfo(INSTAGRAM_REGEX);

          var proxyurl = config.p_url;
          var vidurl = u.url;
          var isvidious = u.isInvidiousURL;
          var mediaproxy = config.media_proxy;

          if (inv_vid?.genre === "Music") {
            var vidurl = u.losslessurl;
          }

          var vidurl = "https://eu-proxy.poketube.fun";
          var isvidious = true;

          if (req.useragent.source.includes("Pardus")) {
            var vidurl = "https://iv.ggtyler.dev";
            var mediaproxy = "https://media-proxy.ashley0143.xyz";
            var isvidious = true;
            var isSchoolProxy = "";
          }

          // unused
          let badges = "";
          let comments = "";
          let nnn = "";

          const dnt_val = isDntEnabled(req);

          if (
            inv_vid?.error ===
              "The uploader has not made this video available in your country" ||
            inv_vid?.error === "This video is not available"
          ) {
            res.send(
              "error: " + inv_vid.error + " please refresh the page please qt"
            );
          }

          var uaos = req.useragent.os;
          const browser = req.useragent.browser;
          const IsOldWindows =
            (uaos === "Windows 7" || uaos === "Windows 8") &&
            browser === "Firefox";

          if (req.query.from === "short") var shortsui = true;

          try {
            renderTemplate(res, req, "lite.ejs", {
              color: data.color,
              color2: data.color2,
              linkify,
              engagement,
              IsOldWindows,
              channelurlfixer,
              support,
              shortsui,
              u: vidurl,
              isvidious: isvidious,
              video: json,
              date: k.Video.uploadDate,
              e,
              a,
              twitter,
              k,
              dm,
              proxyurl,
              media_proxy_url: mediaproxy,
              instagram,
              useragent: req.useragent,
              verify,
              discord,
              turntomins,
              twitch,
              dnt_val,
              reddit,
              channel_uploads,
              secure,
              process,
              isSchoolProxy,
              sha384,
              lightOrDark,
              isMobile: req.useragent.isMobile,
              tj: data.channel,
              r,
              qua: q,
              inv: inv_comments,
              convert,
              universe,
              wiki: data.wiki,
              f,
              t: config.t_url,
              optout: m,
              badges,
              desc,
              comments,
              n: nnn,
              inv_vid,
              lyrics: "",
            });
          } catch {
            return;
          }
        } catch (error) {
          console.error(error);
          return res.redirect(`/watch?v=${req.query.v}&fx=1&err=${error}`);
        }
      }
    );
  });

  app.get("/music", async function (req, res) {
    /*
     * QUERYS
     * v = Video ID
     * e = Embed
     * r = Recommended videos
     * f = Recent videos from channel
     * t = Piwik OptOut
     * q = quality obv
     */
    var v = req.query.v;
    var e = req.query.e;
    var r = req.query.r;
    var f = req.query.f;
    var t = req.query.t;

    const info = await modules.fetch("http://ip-api.com/json/");
    const n = await info.text();
    const ip = JSON.parse(n);

    if (!v) {
      res.redirect("/discover?tab=music");
    } else {
      var fetching = await fetcher(v);

      const json = fetching.video.Player;

      const video = await modules.fetch(config.tubeApi + `video?v=${v}`);

      const h = await video.text();
      const k = JSON.parse(modules.toJson(h));

      if (!json.Channel.Name.endsWith(" - Topic")) {
        res.redirect(`/watch?v=${v}`);
      }

      if (req.useragent.isMobile) {
        res.redirect(`/watch?v=${v}`);
      }

      //video
      var url = `https://tube.kuylar.dev/proxy/media/${v}/22`;

      // encryption
      var url_e =
        url +
        "?e=" +
        sha384(k.Video.Channel.id) +
        sha384(k.Video.Channel.id) +
        "Piwik" +
        sha384(config.t_url);

      const stringed = toObject(atmos);

      const search = (what) => atmos.find((element) => element.id === what);
      const mos = search(v);

      /*
     this is only for the alac codec being used
     
     * Copyright (c) 2023 Apple Inc. All rights reserved.
     *
     * @APPLE_APACHE_LICENSE_HEADER_START@
     * 
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     * 
     *     http://www.apache.org/licenses/LICENSE-2.0
     * 
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     * 
     * @APPLE_APACHE_LICENSE_HEADER_END@
 */

      if (mos) {
        var url_e =
          mos.url +
          "?e=" +
          sha384(k.Video.Channel.id) +
          sha384(k.Video.Channel.id) +
          "Piwik" +
          sha384(config.t_url);
      } else {
      }

      // channel info
      const engagement = fetching.engagement;
      const channel = await modules.fetch(
        config.tubeApi + `channel?id=${k.Video.Channel.id}&tab=videos`
      );
      const c = await channel.text();
      const tj = JSON.parse(modules.toJson(c));

      try {
        // info
        const song = await musicInfo.searchSong(
          {
            title: k.Video.Title,
            artist: json.Channel.Name.replace("- Topic", ""),
          },
          1000
        );

        if (!song) {
          res.redirect(`/watch?v=${v}`);
        }

        const lyrics = await lyricsFinder(song.artist + song.title);
        if (lyrics == undefined)
          ly = "This Is Where I'd Put The songs lyrics. IF IT HAD ONE ";

        var ly = "";
        if (lyrics) {
          ly = lyrics.replace(/\n/g, " <br> ");
        }

        renderTemplate(res, req, "poketube-music.ejs", {
          url: url_e,
          info: song,
          color: await modules
            .getColors(song.artwork)
            .then((colors) => colors[0].hex()),
          engagement: engagement,
          process: process,
          ip: ip,
          video: json,
          date: modules.moment(k.Video.uploadDate).format("LL"),
          e: e,
          k: k,
          sha384: sha384,
          isMobile: req.useragent.isMobile,
          tj: tj,
          r: r,
          f: f,
          t: config.t_url,
          optout: t,
          lyrics: ly,
        });
      } catch {
        return res.redirect("/?fromerror=43");
      }
    }
  });
};
