# Nekocord Built-in Plugins

Nekocord ships with **200** built-in plugins (**198** user-toggleable plugins and **2** core runtime plugins). Each plugin lives in its own directory under `runtime/src/plugins/<slug>/` with `index.ts` and `README.md` metadata.

## Chat (84)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlternatingWordCase](../runtime/src/plugins/alternatingWordCase/README.md) | Off | No | Alternates consecutive words between UPPERCASE and lowercase cadence. |
| [AsciiSmileys](../runtime/src/plugins/asciiSmileys/README.md) | Off | No | Escapes ASCII emoticons like :) and :D so Discord does not auto-convert them. |
| [AutoQuoteBlock](../runtime/src/plugins/autoQuoteBlock/README.md) | Off | No | Prefixes outgoing lines with Discord quote block (> ) Markdown. |
| [AutoSubtext](../runtime/src/plugins/autoSubtext/README.md) | Off | No | Prefixes outgoing lines with Discord small muted subtext (-# ) markup. |
| [AutoWrapUrls](../runtime/src/plugins/autoWrapUrls/README.md) | Off | No | Wraps outgoing links in <...> angle brackets to suppress Discord link embeds. |
| [BoldMessages](../runtime/src/plugins/boldMessages/README.md) | Off | No | Automatically wraps outgoing chat text in **bold** Markdown formatting. |
| [BoldSerifText](../runtime/src/plugins/boldSerifText/README.md) | Off | No | Renders ASCII letters in mathematical bold serif Unicode glyphs. |
| [CatgirlSpeak](../runtime/src/plugins/catgirlSpeak/README.md) | Off | No | Sprinkles gentle nya and mrrp catgirl flair onto non-code messages. |
| [CircledText](../runtime/src/plugins/circledText/README.md) | Off | No | Stylizes outgoing ASCII letters into circled Unicode characters. |
| [ClapBetweenWords](../runtime/src/plugins/clapBetweenWords/README.md) | Off | No | Places clap dividers between outgoing words outside mentions and links. |
| [CoinFlipMacro](../runtime/src/plugins/coinFlipMacro/README.md) | Off | No | Expands /coin into a randomized Heads or Tails flip result before sending. |
| [CompactTimestamps](../runtime/src/plugins/compactTimestamps/README.md) | Off | No | Formats message header timestamps to concise 24-hour HH:MM values. |
| [DdInstagramLinks](../runtime/src/plugins/ddInstagramLinks/README.md) | Off | No | Rewrites Instagram post and reel URLs to ddinstagram.com before sending. |
| [DeletedTimestampAudit](../runtime/src/plugins/deletedTimestampAudit/README.md) | Off | No | Logs deleted message IDs and channel history events in telemetry. |
| [DiceRollMacro](../runtime/src/plugins/diceRollMacro/README.md) | Off | No | Expands /roll NdM dice expressions (like /roll 2d6) into itemized rolls. |
| [DisableDefaultReplyPing](../runtime/src/plugins/disableDefaultReplyPing/README.md) | Off | No | Sets initial reply mention toggle to OFF whenever starting a new reply. |
| [DisapproveShortcut](../runtime/src/plugins/disapproveShortcut/README.md) | Off | No | Expands /lod into the classic look of disapproval. |
| [DoubleVowels](../runtime/src/plugins/doubleVowels/README.md) | Off | No | Stretches final vowels slightly inside expressive words before sending. |
| [EmptyEditDeletes](../runtime/src/plugins/emptyEditDeletes/README.md) | Off | No | Deletes a message automatically if you edit its text down to nothing. |
| [EnableDefaultReplyPing](../runtime/src/plugins/enableDefaultReplyPing/README.md) | Off | No | Forces initial reply mention toggle ON whenever replying to any user. |
| [FixBlueskyLinks](../runtime/src/plugins/fixBlueskyLinks/README.md) | Off | No | Rewrites Bluesky bsky.app post links to bskx.app for rich video embeds. |
| [FixEmbeds](../runtime/src/plugins/fixEmbeds/README.md) | Off | No | Rewrites Twitter/X, TikTok, Instagram, Reddit, and Bluesky links to embed-friendly mirrors. |
| [FixPixivLinks](../runtime/src/plugins/fixPixivLinks/README.md) | Off | No | Rewrites pixiv.net artwork links to phixiv.net for inline illustration previews. |
| [FixThreadsLinks](../runtime/src/plugins/fixThreadsLinks/README.md) | Off | No | Rewrites Threads post links to vxthreads.net so media embeds properly in chat. |
| [FixupXLinks](../runtime/src/plugins/fixupXLinks/README.md) | Off | No | Rewrites outgoing x.com and twitter.com links to fixupx.com embeds. |
| [FrakturText](../runtime/src/plugins/frakturText/README.md) | Off | No | Converts ASCII letters into Gothic Fraktur Unicode glyphs before send. |
| [FullTimestamps](../runtime/src/plugins/fullTimestamps/README.md) | Off | No | Displays exact date and second-level timestamps (YYYY-MM-DD HH:MM:SS) on chat messages. |
| [Greentext](../runtime/src/plugins/greentext/README.md) | Off | No | Formats lines starting with >text into green ANSI blocks while preserving > quotes. |
| [HeadingPrefix](../runtime/src/plugins/headingPrefix/README.md) | Off | No | Adds a clean H3 (### ) header prefix to non-code outgoing lines. |
| [HideStickers](../runtime/src/plugins/hideStickers/README.md) | Off | No | Suppresses sticker renders inline inside chat message rows. |
| [HideTyping](../runtime/src/plugins/hideTyping/README.md) | Off | No | Hides typing indicators from other users by dropping incoming TYPING_START events. |
| [HighlightAttachmentRows](../runtime/src/plugins/highlightAttachmentRows/README.md) | Off | No | Adds a cool cyan gutter accent on messages with attached files or media. |
| [HighlightBotMessages](../runtime/src/plugins/highlightBotMessages/README.md) | Off | No | Marks messages sent by bots or webhooks with a subtle blurple gutter. |
| [HighlightEditedMessages](../runtime/src/plugins/highlightEditedMessages/README.md) | Off | No | Adds a mint gutter stripe to edited messages for quick scanning. |
| [HighlightEveryonePings](../runtime/src/plugins/highlightEveryonePings/README.md) | Off | No | Adds a clear amber accent highlight to messages pinging everyone. |
| [ItalicMessages](../runtime/src/plugins/italicMessages/README.md) | Off | No | Automatically wraps outgoing chat text in *italic* Markdown formatting. |
| [LeetSpeak](../runtime/src/plugins/leetSpeak/README.md) | Off | No | Turns standard letters into classic 1337 digits before sending. |
| [LennyShortcut](../runtime/src/plugins/lennyShortcut/README.md) | Off | No | Expands /lenny in outgoing chat messages. |
| [MessageLogger](../runtime/src/plugins/messageLogger/README.md) | On | Yes | Keeps deleted messages and previous edit revisions inline in chat. |
| [MirrorWords](../runtime/src/plugins/mirrorWords/README.md) | Off | No | Reverses word order inside outgoing text while keeping words readable. |
| [MockingText](../runtime/src/plugins/mockingText/README.md) | Off | No | Converts outgoing prose into alternating mocking case outside links and code blocks. |
| [MoreKaomoji](../runtime/src/plugins/moreKaomoji/README.md) | Off | No | Expands shortcodes such as :shrug:, :tableflip:, :lenny:, and :cat: into kaomoji on send. |
| [NoBlockedMessages](../runtime/src/plugins/noBlockedMessages/README.md) | Off | Yes | Completely hides incoming and loaded messages from blocked or ignored users. |
| [NoDiscordAutoEmoji](../runtime/src/plugins/noDiscordAutoEmoji/README.md) | Off | No | Escapes colon :shortcode: tokens with a backslash to preserve literal text. |
| [NoEditLabel](../runtime/src/plugins/noEditLabel/README.md) | Off | No | Hides the (edited) tag while preserving MessageLogger deleted markers. |
| [NoMosaic](../runtime/src/plugins/noMosaic/README.md) | Off | No | Disables Discord multi-image mosaic cropping so attachments render cleanly. |
| [NoReplyMention](../runtime/src/plugins/noReplyMention/README.md) | On | No | Automatically disables ping mentions when starting a message reply. |
| [NormalizeUsernames](../runtime/src/plugins/normalizeUsernames/README.md) | Off | No | Strips zero-width control characters and excess spacing from usernames. |
| [NoSuperReactions](../runtime/src/plugins/noSuperReactions/README.md) | Off | No | Flattens animated Nitro super reactions into standard message reactions. |
| [PigLatin](../runtime/src/plugins/pigLatin/README.md) | Off | No | Converts standard English words outside code and mentions into Pig Latin. |
| [PirateSpeak](../runtime/src/plugins/pirateSpeak/README.md) | Off | No | Adds classic pirate dialect flavor to everyday words before sending. |
| [ProtectMessageDrafts](../runtime/src/plugins/protectMessageDrafts/README.md) | Off | No | Blocks unexpected DRAFT_CLEAR dispatches so unsent drafts stay intact. |
| [RevealAllSpoilers](../runtime/src/plugins/revealAllSpoilers/README.md) | Off | No | Automatically reveals inline text and attachment spoilers in chat. |
| [ReverseSentences](../runtime/src/plugins/reverseSentences/README.md) | Off | No | Reverses the sequence of sentences inside multi-sentence messages. |
| [ReverseText](../runtime/src/plugins/reverseText/README.md) | Off | No | Reverses outgoing message prose while keeping links, mentions, emojis, and code intact. |
| [RussianTranslit](../runtime/src/plugins/russianTranslit/README.md) | Off | No | Substitutes lookalike Latin letters with matching Cyrillic homoglyphs. |
| [RxdditLinks](../runtime/src/plugins/rxdditLinks/README.md) | Off | No | Rewrites outgoing reddit.com links to rxddit.com for inline video and gallery cards. |
| [SendTimestamps](../runtime/src/plugins/sendTimestamps/README.md) | Off | No | Converts @HH:MM and @YYYY-MM-DD HH:MM tokens into native Discord dynamic timestamps. |
| [SentenceCaseFix](../runtime/src/plugins/sentenceCaseFix/README.md) | Off | No | Automatically capitalizes the opening letter of each sentence. |
| [ShakespeareSpeak](../runtime/src/plugins/shakespeareSpeak/README.md) | Off | No | Lightly adapts pronouns and greetings into Early Modern English phrasing. |
| [ShoutCase](../runtime/src/plugins/shoutCase/README.md) | Off | No | Converts outgoing chat words to UPPERCASE outside code and mentions. |
| [ShowMeYourName](../runtime/src/plugins/showMeYourName/README.md) | Off | No | Displays each message author @username next to their display name in chat. |
| [ShrugShortcut](../runtime/src/plugins/shrugShortcut/README.md) | Off | No | Expands /shrug into the classic shrug emoticon automatically. |
| [SilentMessages](../runtime/src/plugins/silentMessages/README.md) | Off | No | Automatically prepends @silent to outgoing messages so recipients are not pinged. |
| [SmallCapsText](../runtime/src/plugins/smallCapsText/README.md) | Off | No | Converts lowercase text into clean Unicode small-caps letters. |
| [SpaceLetters](../runtime/src/plugins/spaceLetters/README.md) | Off | No | Inserts gentle spaces between characters of regular words for emphasis. |
| [SpoilerEveryWord](../runtime/src/plugins/spoilerEveryWord/README.md) | Off | No | Wraps every non-code word in \|\|spoiler\|\| tags individually. |
| [SpoilerMessage](../runtime/src/plugins/spoilerMessage/README.md) | Off | No | Wraps your entire outgoing message in \|\|spoiler\|\| tags automatically. |
| [SquareText](../runtime/src/plugins/squareText/README.md) | Off | No | Converts letters into enclosed squared Unicode block letters. |
| [StrikethroughMessages](../runtime/src/plugins/strikethroughMessages/README.md) | Off | No | Wraps outgoing prose in ~~strikethrough~~ Markdown tags. |
| [StutterText](../runtime/src/plugins/stutterText/README.md) | Off | No | Adds subtle initial-letter stutter phrasing to opening words. |
| [SuppressEmbedsOnSend](../runtime/src/plugins/suppressEmbedsOnSend/README.md) | Off | No | Marks outgoing messages containing URLs with the suppress-embeds flag. |
| [TableflipShortcut](../runtime/src/plugins/tableflipShortcut/README.md) | Off | No | Expands /tableflip in outgoing messages into the classic flip emoticon. |
| [TitleCaseChat](../runtime/src/plugins/titleCaseChat/README.md) | Off | No | Capitalizes the first letter of every word before sending. |
| [UnderlineMessages](../runtime/src/plugins/underlineMessages/README.md) | Off | No | Automatically wraps outgoing chat text in __underline__ Markdown formatting. |
| [UnflipShortcut](../runtime/src/plugins/unflipShortcut/README.md) | Off | No | Expands /unflip into the upright table restore emoticon. |
| [UnwrapAngleUrls](../runtime/src/plugins/unwrapAngleUrls/README.md) | Off | No | Removes surrounding <...> brackets from outgoing URLs so previews embed normally. |
| [UpsideDownText](../runtime/src/plugins/upsideDownText/README.md) | Off | No | Flips outgoing chat sentences upside down outside links and code blocks. |
| [UwUify](../runtime/src/plugins/uwuify/README.md) | Off | No | Transforms outgoing chat prose while keeping links, mentions, emojis, and code blocks intact. |
| [VaporwaveText](../runtime/src/plugins/vaporwaveText/README.md) | Off | No | Converts outgoing ASCII characters into aesthetic fullwidth characters. |
| [VxTikTokLinks](../runtime/src/plugins/vxTikTokLinks/README.md) | Off | No | Rewrites outgoing tiktok.com links to vxtiktok.com for reliable video previews. |
| [VxTwitterLinks](../runtime/src/plugins/vxTwitterLinks/README.md) | Off | No | Rewrites outgoing x.com and twitter.com links to vxtwitter.com embeds. |
| [WhisperCase](../runtime/src/plugins/whisperCase/README.md) | Off | No | Converts outgoing chat words to lowercase outside code and mentions. |
| [ZalgoLite](../runtime/src/plugins/zalgoLite/README.md) | Off | No | Adds light glitch diacritics to regular words outside links and code. |

## UI (38)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [BetterRoleDot](../runtime/src/plugins/betterRoleDot/README.md) | Off | No | Forces role color dots and username role colors to show on chat messages. |
| [CompactReactionRow](../runtime/src/plugins/compactReactionRow/README.md) | Off | No | Caps visible reaction chips per message at six to stop reaction walls. |
| [DefaultUserAvatars](../runtime/src/plugins/defaultUserAvatars/README.md) | Off | No | Replaces custom user avatars with Discord monochrome default icons in chat. |
| [DimBotAttachments](../runtime/src/plugins/dimBotAttachments/README.md) | Off | No | Lowers media opacity slightly on automated bot and webhook attachments. |
| [DisableUploadPreview](../runtime/src/plugins/disableUploadPreview/README.md) | Off | No | Disables expanded attachment upload card previews in chat rows. |
| [HideActivityInvites](../runtime/src/plugins/hideActivityInvites/README.md) | Off | No | Hides Rich Presence game and Spotify party invite cards in chat. |
| [HideAppsButton](../runtime/src/plugins/hideAppsButton/README.md) | Off | Yes | Hides the Apps and Commands launcher button from the chat composer. |
| [HideChannelNotices](../runtime/src/plugins/hideChannelNotices/README.md) | Off | No | Dismisses noisy channel notice and dismissible server prompt banners. |
| [HideChannelPrompts](../runtime/src/plugins/hideChannelPrompts/README.md) | Off | No | Suppresses wave-to-say-hi and conversation starter prompt cards. |
| [HideEmbedAuthors](../runtime/src/plugins/hideEmbedAuthors/README.md) | Off | No | Removes redundant author headers and footer lines inside chat embeds. |
| [HideEmbeds](../runtime/src/plugins/hideEmbeds/README.md) | Off | No | Hides all link and rich embed cards rendered beneath messages. |
| [HideForwardHeaders](../runtime/src/plugins/hideForwardHeaders/README.md) | Off | No | Removes the Forwarded message source header above forwarded content. |
| [HideGiftButton](../runtime/src/plugins/hideGiftButton/README.md) | Off | Yes | Hides the Nitro gift button from the chat message composer. |
| [HideGiftIntents](../runtime/src/plugins/hideGiftIntents/README.md) | Off | No | Removes birthday and Nitro gift prompt banners inside message rows. |
| [HideMediaAttachments](../runtime/src/plugins/hideMediaAttachments/README.md) | Off | No | Hides inline file and media attachment boxes from the chat timeline. |
| [HidePolls](../runtime/src/plugins/hidePolls/README.md) | Off | No | Hides interactive poll cards from the chat timeline. |
| [HidePostPreviews](../runtime/src/plugins/hidePostPreviews/README.md) | Off | No | Removes forum post preview embeds inside message rows. |
| [HidePronouns](../runtime/src/plugins/hidePronouns/README.md) | Off | Yes | Clears pronoun labels on opened user and member profiles. |
| [HideReactions](../runtime/src/plugins/hideReactions/README.md) | Off | No | Hides all reaction chip rows underneath chat messages. |
| [HideThreadCards](../runtime/src/plugins/hideThreadCards/README.md) | Off | No | Removes inline thread embed summary cards from channel chat. |
| [HideUserBanners](../runtime/src/plugins/hideUserBanners/README.md) | Off | Yes | Strips custom Nitro profile banners to preserve clean profile headers. |
| [HideUserBios](../runtime/src/plugins/hideUserBios/README.md) | Off | Yes | Hides custom About Me bios on opened Discord profile sheets. |
| [HideVoiceChannelBadges](../runtime/src/plugins/hideVoiceChannelBadges/README.md) | Off | No | Hides In Voice badges next to message authors currently in voice. |
| [NekocordSettingsUI](../runtime/src/plugins/nekocordSettingsUI/README.md) | On | No | Integrates Nekocord overview, plugins, and themes directly into Discord User Settings. |
| [NoAvatarDecorations](../runtime/src/plugins/noAvatarDecorations/README.md) | Off | No | Hides Nitro avatar decorations on messages and user profiles. |
| [NoBotBadges](../runtime/src/plugins/noBotBadges/README.md) | Off | No | Hides BOT, APP, and webhook tag pills next to author names. |
| [NoClanTags](../runtime/src/plugins/noClanTags/README.md) | Off | No | Hides server clan tags and badges displayed beside usernames in chat. |
| [NoConnectionsRoleTag](../runtime/src/plugins/noConnectionsRoleTag/README.md) | Off | No | Hides linked connections role pills shown next to chat authors. |
| [NoEmbedThumbnails](../runtime/src/plugins/noEmbedThumbnails/README.md) | Off | No | Strips thumbnails, preview images, and video frames from link embeds. |
| [NoInlineForwardButton](../runtime/src/plugins/noInlineForwardButton/README.md) | Off | No | Hides inline quick-forward buttons rendered next to chat media and messages. |
| [NoLinkDecorations](../runtime/src/plugins/noLinkDecorations/README.md) | Off | No | Removes extra decorative icons next to links in chat messages. |
| [NoOpTag](../runtime/src/plugins/noOpTag/README.md) | Off | No | Hides Original Poster (OP) badges inside forum and text threads. |
| [NoPendingCount](../runtime/src/plugins/noPendingCount/README.md) | Off | Yes | Clears pending friend request and message request count badges. |
| [NoProfileEffects](../runtime/src/plugins/noProfileEffects/README.md) | Off | Yes | Strips animated Nitro profile effects from user profile cards. |
| [NoProfileThemes](../runtime/src/plugins/noProfileThemes/README.md) | Off | Yes | Strips custom Nitro profile theme colors so user profiles use your base Discord theme. |
| [NoRoleColors](../runtime/src/plugins/noRoleColors/README.md) | Off | No | Removes custom role username colours for a uniform neutral feed. |
| [NoRoleIcons](../runtime/src/plugins/noRoleIcons/README.md) | Off | No | Hides custom role icons beside author names in chat. |
| [OnlyMyReactions](../runtime/src/plugins/onlyMyReactions/README.md) | Off | No | Shows only reactions that you have reacted with in chat rows. |

## Privacy (30)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AnonymiseFileNames](../runtime/src/plugins/anonymiseFileNames/README.md) | Off | No | Randomizes uploaded attachment filenames to 8-character hex names. |
| [BlockCallTelemetry](../runtime/src/plugins/blockCallTelemetry/README.md) | Off | No | Suppresses outgoing voice quality metrics and media connection stats dispatches. |
| [BlockTypingDispatch](../runtime/src/plugins/blockTypingDispatch/README.md) | Off | No | Blocks local TYPING_START_LOCAL and channel typing broadcast actions. |
| [CleanAliExpressLinks](../runtime/src/plugins/cleanAliExpressLinks/README.md) | Off | No | Strips tracking query junk from outgoing AliExpress item links. |
| [CleanAmazonLinks](../runtime/src/plugins/cleanAmazonLinks/README.md) | Off | No | Strips tracking slugs and referral queries down to canonical Amazon /dp/ASIN links. |
| [CleanInstagramShare](../runtime/src/plugins/cleanInstagramShare/README.md) | Off | No | Strips igsh and tracking parameters from outgoing Instagram URLs. |
| [CleanSpotifyLinks](../runtime/src/plugins/cleanSpotifyLinks/README.md) | Off | No | Removes ?si= and share-tracking parameters from outgoing Spotify links. |
| [CleanZeroWidthSend](../runtime/src/plugins/cleanZeroWidthSend/README.md) | Off | No | Strips invisible zero-width joiners and BOM bytes from outgoing messages. |
| [ClearURLs](../runtime/src/plugins/clearUrls/README.md) | On | No | Strips tracking query parameters such as utm_*, fbclid, igsh, and si from outgoing links. |
| [FlagSuspiciousDownloads](../runtime/src/plugins/flagSuspiciousDownloads/README.md) | Off | No | Prepends a warning badge to messages carrying flagged or suspicious files. |
| [ForceHttpsLinks](../runtime/src/plugins/forceHttpsLinks/README.md) | Off | No | Upgrades outgoing insecure http:// web links to https:// automatically. |
| [FriendRemovedAudit](../runtime/src/plugins/friendRemovedAudit/README.md) | Off | No | Tracks friend and relationship removal events via Flux telemetry. |
| [GuildLeaveAudit](../runtime/src/plugins/guildLeaveAudit/README.md) | Off | No | Tracks guild kick/leave dispatches so unexpected removals are visible. |
| [HideSafetyNotices](../runtime/src/plugins/hideSafetyNotices/README.md) | Off | No | Hides Discord safety system alert banners inserted into chat rows. |
| [InvidiousLinks](../runtime/src/plugins/invidiousLinks/README.md) | Off | No | Rewrites YouTube watch links to the privacy-friendly yewtu.be Invidious instance. |
| [LibredditLinks](../runtime/src/plugins/libredditLinks/README.md) | Off | No | Routes outgoing Reddit links through a lightweight Redlib privacy frontend. |
| [MuteNewGuild](../runtime/src/plugins/muteNewGuild/README.md) | Off | No | Automatically mutes notifications and @everyone/@here pings when joining new servers. |
| [NitterLinks](../runtime/src/plugins/nitterLinks/README.md) | Off | No | Rewrites Twitter and X links to an anonymous Nitter mirror before sending. |
| [NoAnalyticsBeacons](../runtime/src/plugins/noAnalyticsBeacons/README.md) | Off | Yes | Drops internal Discord impression, exposure, and heartbeat metric beacons. |
| [NoPresenceTelemetry](../runtime/src/plugins/noPresenceTelemetry/README.md) | Off | No | Drops rich presence tracking and activity launch metric actions. |
| [NoTrack](../runtime/src/plugins/noTrack/README.md) | On | No | Drops Discord analytics and telemetry Flux dispatches before they are recorded. |
| [RedactEmails](../runtime/src/plugins/redactEmails/README.md) | Off | No | Automatically redacts email addresses before outgoing messages are sent. |
| [RedactIpv4Addresses](../runtime/src/plugins/redactIpv4Addresses/README.md) | Off | No | Masks public IPv4 addresses in outgoing chat text to prevent accidental leaks. |
| [RedactJwtTokens](../runtime/src/plugins/redactJwtTokens/README.md) | Off | No | Intercepts and redacts leaked JWTs or token-like strings before upload. |
| [RedactPhoneNumbers](../runtime/src/plugins/redactPhoneNumbers/README.md) | Off | No | Masks accidental international or local phone numbers in outgoing chat. |
| [SilentChannelSelect](../runtime/src/plugins/silentChannelSelect/README.md) | Off | No | Drops client channel navigation and thread view metric dispatches. |
| [SilentTyping](../runtime/src/plugins/silentTyping/README.md) | Off | No | Prevents Discord from broadcasting your typing indicator to channels. |
| [StripReferralUpsells](../runtime/src/plugins/stripReferralUpsells/README.md) | Off | No | Blocks Nitro referral upsell modal dispatches and marketing impressions. |
| [SuppressReadReceipts](../runtime/src/plugins/suppressReadReceipts/README.md) | Off | Yes | Blocks outgoing channel read receipt acknowledgements when browsing. |
| [YoutubeNoCookie](../runtime/src/plugins/youtubeNoCookie/README.md) | Off | No | Converts YouTube watch links into youtube-nocookie.com privacy embed URLs. |

## Utility (18)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysTrust](../runtime/src/plugins/alwaysTrust/README.md) | Off | Yes | Automatically trusts external links and skips untrusted domain warning prompts. |
| [AutoPeriod](../runtime/src/plugins/autoPeriod/README.md) | Off | No | Appends a period when an outgoing sentence ends with an alphanumeric character. |
| [BreezeWikiLinks](../runtime/src/plugins/breezeWikiLinks/README.md) | Off | No | Rewrites ad-heavy fandom.com wiki links to clean breezewiki.com reader URLs. |
| [CollapseSpaces](../runtime/src/plugins/collapseSpaces/README.md) | Off | No | Collapses multiple consecutive spaces inside sentences into single spaces. |
| [DesktopWikipediaLinks](../runtime/src/plugins/desktopWikipediaLinks/README.md) | Off | No | Converts mobile en.m.wikipedia.org links into standard desktop Wikipedia URLs. |
| [ExpandShortYoutuBe](../runtime/src/plugins/expandShortYoutuBe/README.md) | Off | No | Expands youtu.be shortlinks to full youtube.com/watch?v= URLs. |
| [IsoDateMacro](../runtime/src/plugins/isoDateMacro/README.md) | Off | No | Replaces /today with today's ISO YYYY-MM-DD date stamp. |
| [MorseCodeMacro](../runtime/src/plugins/morseCodeMacro/README.md) | Off | No | Translates /morse <text> into International Morse dots and dashes. |
| [NSFWGateBypass](../runtime/src/plugins/nsfwGateBypass/README.md) | Off | Yes | Bypasses client-side NSFW channel and age-gate prompts. |
| [OldRedditLinks](../runtime/src/plugins/oldRedditLinks/README.md) | Off | No | Converts outgoing reddit.com links to classic old.reddit.com. |
| [QuickMathEval](../runtime/src/plugins/quickMathEval/README.md) | Off | No | Evaluates /calc <expr> inline arithmetic cleanly using a safe math parser. |
| [RelationshipNotifier](../runtime/src/plugins/relationshipNotifier/README.md) | Off | No | Tracks friend removals, server kicks/bans, and group DM removals in real time. |
| [Rot13Macro](../runtime/src/plugins/rot13Macro/README.md) | Off | No | Transforms /rot13 <text> payloads using classic ROT13 letter rotation. |
| [ShowAttachmentAltText](../runtime/src/plugins/showAttachmentAltText/README.md) | Off | No | Displays image alt-text descriptions inline beneath message text. |
| [SmartDashes](../runtime/src/plugins/smartDashes/README.md) | Off | No | Converts double hyphens (-- ) and ellipses (...) into clean Unicode dashes. |
| [SmartQuotes](../runtime/src/plugins/smartQuotes/README.md) | Off | No | Replaces plain ASCII quotes with balanced typographic curly quotes. |
| [StripYoutubeShorts](../runtime/src/plugins/stripYoutubeShorts/README.md) | Off | No | Converts YouTube Shorts URLs to standard watch?v= links before sending. |
| [TrimTrailingSpaces](../runtime/src/plugins/trimTrailingSpaces/README.md) | Off | No | Trims leading/trailing whitespace and collapses excessive empty newlines. |

## Developer (15)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AutoCodeBlock](../runtime/src/plugins/autoCodeBlock/README.md) | Off | No | Wraps multi-line stack traces and JSON blocks automatically inside code fences. |
| [Base64DecodeMacro](../runtime/src/plugins/base64DecodeMacro/README.md) | Off | No | Decodes /unb64 <base64> text inline before sending. |
| [Base64EncodeMacro](../runtime/src/plugins/base64EncodeMacro/README.md) | Off | No | Encodes /b64 <text> messages cleanly as UTF-8 Base64 before sending. |
| [BinaryEncodeMacro](../runtime/src/plugins/binaryEncodeMacro/README.md) | Off | No | Converts /bin <text> payloads into 8-bit binary octets before sending. |
| [BypassSlowmodeDisplay](../runtime/src/plugins/bypassSlowmodeDisplay/README.md) | Off | Yes | Clears the client-side slowmode cooldown display lock in CooldownStore. |
| [CharacterCountTag](../runtime/src/plugins/characterCountTag/README.md) | Off | No | Appends a subtle character count footer to outgoing messages over 20 chars. |
| [DeveloperMode](../runtime/src/plugins/developerMode/README.md) | On | Yes | Forces Discord internal developer options flag to enabled. |
| [Experiments](../runtime/src/plugins/experiments/README.md) | Off | Yes | Unlocks Discord internal Experiments and Staff developer settings tabs. |
| [HexEncodeMacro](../runtime/src/plugins/hexEncodeMacro/README.md) | Off | No | Converts /hex <text> payloads into space-separated hexadecimal bytes. |
| [LoremIpsumMacro](../runtime/src/plugins/loremIpsumMacro/README.md) | Off | No | Expands /lorem into standard placeholder text for UI or chat layout tests. |
| [MonospaceNumbers](../runtime/src/plugins/monospaceNumbers/README.md) | Off | No | Converts ASCII digits in outgoing text into Unicode monospace numerals. |
| [SnowflakeIdsInChat](../runtime/src/plugins/snowflakeIdsInChat/README.md) | Off | No | Appends message snowflake ID suffixes directly to message headers. |
| [UnixNowMacro](../runtime/src/plugins/unixNowMacro/README.md) | Off | No | Replaces /unixnow with Discord dynamic timestamp markup for the current time. |
| [UnixTimestamps](../runtime/src/plugins/unixTimestamps/README.md) | Off | No | Appends exact Unix epoch seconds to chat message timestamps. |
| [UrlEncodeMacro](../runtime/src/plugins/urlEncodeMacro/README.md) | Off | No | Percent-encodes /urlencode <text> values safely before sending. |

## Nitro (9)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysAnimate](../runtime/src/plugins/alwaysAnimate/README.md) | Off | Yes | Keeps GIFs, custom emojis, and stickers animating automatically. |
| [DisableReducedMotionLock](../runtime/src/plugins/disableReducedMotionLock/README.md) | Off | Yes | Prevents reduced-motion flags from freezing animated Nitro assets. |
| [FakeNitro](../runtime/src/plugins/fakeNitro/README.md) | On | Yes | Unlocks locked emojis, stickers, and client Nitro perks with native chat rendering. |
| [ForceNitroVisuals](../runtime/src/plugins/forceNitroVisuals/README.md) | Off | Yes | Spoofs local Nitro Full badge visibility on your own current user object. |
| [HidePremiumUpsells](../runtime/src/plugins/hidePremiumUpsells/README.md) | Off | Yes | Suppresses client Nitro upsell prompts across pickers and settings menus. |
| [HighlightStickersInChat](../runtime/src/plugins/highlightStickersInChat/README.md) | Off | No | Highlights messages containing custom or Nitro stickers with a purple gutter. |
| [NoGifAutoplay](../runtime/src/plugins/noGifAutoplay/README.md) | Off | No | Stops animated GIFs in chat from auto-playing until tapped. |
| [UnlockBurstChecks](../runtime/src/plugins/unlockBurstChecks/README.md) | Off | Yes | Clears client cooldown and upsell gates on burst super-reaction checks. |
| [UnlockClientThemes](../runtime/src/plugins/unlockClientThemes/README.md) | Off | Yes | Unlocks preview access to Nitro client themes and custom background checks. |

## Voice (5)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [FakeDeafen](../runtime/src/plugins/fakeDeafen/README.md) | Off | No | Spoofs self-deafen and self-mute to Discord voice gateway while keeping audio active. |
| [VoiceChannelAudit](../runtime/src/plugins/voiceChannelAudit/README.md) | Off | No | Counts and records voice channel join/leave updates for diagnostics. |
| [VoiceDeafenOnJoin](../runtime/src/plugins/voiceDeafenOnJoin/README.md) | Off | No | Automatically self-deafens whenever you connect into a voice channel. |
| [VoiceMuteOnJoin](../runtime/src/plugins/voiceMuteOnJoin/README.md) | Off | No | Automatically mutes your microphone when joining or switching voice channels. |
| [VoiceUnmuteOnLeave](../runtime/src/plugins/voiceUnmuteOnLeave/README.md) | Off | No | Clears local self-mute automatically when leaving a voice call. |

## Core (1)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [NekocordBanner](../runtime/src/plugins/nekocordBanner/README.md) | On | No | Logs Nekocord startup diagnostics and verifies Metro module discovery. |
