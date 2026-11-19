# Nekocord Built-in Plugins

Nekocord ships with **408** built-in plugins (**406** user-toggleable plugins and **2** core runtime plugins). Each plugin lives in its own directory under `runtime/src/plugins/<slug>/` with `index.ts` and `README.md` metadata.

## Chat (145)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlternatingWordCase](../runtime/src/plugins/alternatingWordCase/README.md) | Off | No | Alternates words between UPPERCASE and lowercase in messages you send. |
| [ArrowShortcuts](../runtime/src/plugins/arrowShortcuts/README.md) | Off | No | Turns typed arrows (->, <-, <->, =>) into clean arrow symbols when sending. |
| [AsciiSmileys](../runtime/src/plugins/asciiSmileys/README.md) | Off | No | Keeps typed smileys like :) and :D as plain text instead of Discord emojis. |
| [AutoCapitalizeFirst](../runtime/src/plugins/autoCapitalizeFirst/README.md) | Off | No | Capitalizes the first letter of sentences you send outside code blocks. |
| [AutoCloseCodeFences](../runtime/src/plugins/autoCloseCodeFences/README.md) | Off | No | Closes unclosed triple-backtick code blocks automatically before sending. |
| [AutoEscapeUnderscores](../runtime/src/plugins/autoEscapeUnderscores/README.md) | Off | No | Keeps underscores in words like snake_case instead of turning them italic. |
| [AutoQuoteBlock](../runtime/src/plugins/autoQuoteBlock/README.md) | Off | No | Turns lines you send into Discord quote blocks (> ). |
| [AutoReplyAway](../runtime/src/plugins/autoReplyAway/README.md) | Off | No | Automatically replies once per chat cooldown when someone messages you in DMs. |
| [AutoSubtext](../runtime/src/plugins/autoSubtext/README.md) | Off | No | Turns lines you send into small muted fine-print notes (-# ). |
| [AutoWrapUrls](../runtime/src/plugins/autoWrapUrls/README.md) | Off | No | Wraps links you send in <...> so Discord does not show link preview boxes. |
| [BlurNsfw](../runtime/src/plugins/blurNsfw/README.md) | Off | No | Blurs images and videos in age-restricted channels until you tap them. |
| [BoldMessages](../runtime/src/plugins/boldMessages/README.md) | Off | No | Makes all text you send bold using **bold** formatting. |
| [BoldSerifText](../runtime/src/plugins/boldSerifText/README.md) | Off | No | Converts text you send into bold serif lettering. |
| [BulletListShortcut](../runtime/src/plugins/bulletListShortcut/README.md) | Off | No | Turns lines starting with - or * into clean bullet points when sending. |
| [CatgirlSpeak](../runtime/src/plugins/catgirlSpeak/README.md) | Off | No | Adds cute nya and mrrp catgirl flair to everyday messages. |
| [ChatPrefixSuffix](../runtime/src/plugins/chatPrefixSuffix/README.md) | Off | No | Adds custom prefix or ending text to messages you send. |
| [ChecklistMacro](../runtime/src/plugins/checklistMacro/README.md) | Off | No | Turns [ ] and [x] items into clean checklist boxes when sending. |
| [CircledText](../runtime/src/plugins/circledText/README.md) | Off | No | Converts letters in your message into circled characters. |
| [ClapBetweenWords](../runtime/src/plugins/clapBetweenWords/README.md) | Off | No | Adds clap emojis between words in messages you send. |
| [CoinFlipMacro](../runtime/src/plugins/coinFlipMacro/README.md) | Off | No | Turns /coin into a random Heads or Tails flip when sending. |
| [CompactTimestamps](../runtime/src/plugins/compactTimestamps/README.md) | Off | No | Shows message times in a short 24-hour HH:MM format. |
| [CopyEmojiMarkdown](../runtime/src/plugins/copyEmojiMarkdown/README.md) | Off | No | Shows the emoji code next to custom emojis in chat so you can copy it. |
| [CurrencySymbolsMacro](../runtime/src/plugins/currencySymbolsMacro/README.md) | Off | No | Turns \eur, \gbp, \jpy, \krw, and \btc into currency symbols. |
| [CustomTimestamps](../runtime/src/plugins/customTimestamps/README.md) | Off | No | Lets you pick how dates and times look next to chat messages. |
| [DdInstagramLinks](../runtime/src/plugins/ddInstagramLinks/README.md) | Off | No | Rewrites Instagram post and reel links to ddinstagram.com for better previews. |
| [DeletedTimestampAudit](../runtime/src/plugins/deletedTimestampAudit/README.md) | Off | No | Saves the ID and channel of deleted messages for reference. |
| [DiceRollMacro](../runtime/src/plugins/diceRollMacro/README.md) | Off | No | Turns /roll 2d6 into rolled dice numbers before sending. |
| [DisableDefaultReplyPing](../runtime/src/plugins/disableDefaultReplyPing/README.md) | Off | No | Turns off reply pings by default whenever you start a reply. |
| [DisapproveShortcut](../runtime/src/plugins/disapproveShortcut/README.md) | Off | No | Turns /lod into the classic look of disapproval. |
| [DontRoundMyTimestamps](../runtime/src/plugins/dontRoundMyTimestamps/README.md) | Off | No | Shows exact minutes and seconds on timestamps instead of rounded times. |
| [DoubleVowels](../runtime/src/plugins/doubleVowels/README.md) | Off | No | Stretches the last vowel slightly in words you send. |
| [EmptyEditDeletes](../runtime/src/plugins/emptyEditDeletes/README.md) | Off | No | Deletes a message automatically if you edit it to be empty. |
| [EnableDefaultReplyPing](../runtime/src/plugins/enableDefaultReplyPing/README.md) | Off | No | Turns reply pings on by default whenever you reply to someone. |
| [ExpandDiscordInvites](../runtime/src/plugins/expandDiscordInvites/README.md) | Off | No | Expands short discord.gg/ invites into full discord.com/invite/ links. |
| [ExpandImagePreviewSize](../runtime/src/plugins/expandImagePreviewSize/README.md) | Off | No | Loads full-resolution previews for images and embeds in chat. |
| [FixBlueskyLinks](../runtime/src/plugins/fixBlueskyLinks/README.md) | Off | No | Converts bsky.app links to bskx.app so videos play smoothly in chat. |
| [FixCodeblockGap](../runtime/src/plugins/fixCodeblockGap/README.md) | Off | No | Removes extra blank lines around code blocks before sending. |
| [FixDoublePunctuation](../runtime/src/plugins/fixDoublePunctuation/README.md) | Off | No | Removes accidental spaces before commas and periods before sending. |
| [FixEmbeds](../runtime/src/plugins/fixEmbeds/README.md) | Off | No | Fixes video and image previews for Twitter/X, TikTok, Instagram, Reddit, and Bluesky links. |
| [FixImagesQuality](../runtime/src/plugins/fixImagesQuality/README.md) | Off | No | Loads Discord images in full lossless quality. |
| [FixPixivLinks](../runtime/src/plugins/fixPixivLinks/README.md) | Off | No | Converts pixiv.net links so artworks preview cleanly in Discord chat. |
| [FixThreadsLinks](../runtime/src/plugins/fixThreadsLinks/README.md) | Off | No | Converts Threads links so posts and videos preview in Discord chat. |
| [FixupXLinks](../runtime/src/plugins/fixupXLinks/README.md) | Off | No | Converts x.com and twitter.com links to fixupx.com for reliable previews. |
| [FractionShortcuts](../runtime/src/plugins/fractionShortcuts/README.md) | Off | No | Turns 1/2, 1/4, 3/4, 1/3, and 2/3 into clean fraction characters. |
| [FrakturText](../runtime/src/plugins/frakturText/README.md) | Off | No | Converts letters in your message into Gothic Fraktur style. |
| [FullTimestamps](../runtime/src/plugins/fullTimestamps/README.md) | Off | No | Shows full date and seconds next to chat messages. |
| [Greentext](../runtime/src/plugins/greentext/README.md) | Off | No | Turns lines starting with >text into green quote text in chat. |
| [HeadingPrefix](../runtime/src/plugins/headingPrefix/README.md) | Off | No | Adds a medium ### heading prefix to lines you send. |
| [HideAttachments](../runtime/src/plugins/hideAttachments/README.md) | Off | No | Hides image and file previews in chat while keeping message text. |
| [HideStickers](../runtime/src/plugins/hideStickers/README.md) | Off | No | Hides sticker images inside chat messages. |
| [HideTyping](../runtime/src/plugins/hideTyping/README.md) | Off | No | Hides typing indicators from other people across Discord. |
| [HighlightAttachmentRows](../runtime/src/plugins/highlightAttachmentRows/README.md) | Off | No | Highlights messages that include files or media with a blue accent. |
| [HighlightBotMessages](../runtime/src/plugins/highlightBotMessages/README.md) | Off | No | Marks bot messages with a subtle purple side accent. |
| [HighlightCodeBlocks](../runtime/src/plugins/highlightCodeBlocks/README.md) | Off | No | Highlights messages containing code blocks. |
| [HighlightEditedMessages](../runtime/src/plugins/highlightEditedMessages/README.md) | Off | No | Adds a green side accent to edited messages. |
| [HighlightEveryonePings](../runtime/src/plugins/highlightEveryonePings/README.md) | Off | No | Highlights messages pinging everyone in warm amber. |
| [HighlightFileAttachments](../runtime/src/plugins/highlightFileAttachments/README.md) | Off | No | Shows a [file] label on messages with non-image file downloads. |
| [HighlightLinks](../runtime/src/plugins/highlightLinks/README.md) | Off | No | Highlights incoming messages that include web links. |
| [HighlightLongMessages](../runtime/src/plugins/highlightLongMessages/README.md) | Off | No | Highlights long messages (over 350 characters) for easier scanning. |
| [HighlightMentionsOfMe](../runtime/src/plugins/highlightMentionsOfMe/README.md) | Off | No | Highlights messages that mention you in warm amber. |
| [HighlightNitroGifts](../runtime/src/plugins/highlightNitroGifts/README.md) | Off | No | Highlights messages containing Nitro gift links in green. |
| [HighlightPinnedIndicator](../runtime/src/plugins/highlightPinnedIndicator/README.md) | Off | No | Adds a [pinned] label next to timestamps on pinned messages. |
| [HighlightQuestions](../runtime/src/plugins/highlightQuestions/README.md) | Off | No | Highlights incoming question messages ending with a question mark. |
| [HighlightReplies](../runtime/src/plugins/highlightReplies/README.md) | Off | No | Highlights messages that reply to another message. |
| [HighlightSystemMessages](../runtime/src/plugins/highlightSystemMessages/README.md) | Off | No | Highlights system announcements with a soft purple accent. |
| [HighlightVoiceMessages](../runtime/src/plugins/highlightVoiceMessages/README.md) | Off | No | Highlights voice note messages with an amber side accent. |
| [ILoveSpam](../runtime/src/plugins/iLoveSpam/README.md) | Off | No | Stops Discord from automatically hiding messages marked as likely spam. |
| [ImageFilename](../runtime/src/plugins/imageFilename/README.md) | Off | No | Shows attachment filenames and file sizes beneath images in chat. |
| [IrcColors](../runtime/src/plugins/ircColors/README.md) | Off | No | Gives each username a distinct pastel color when they have no role color. |
| [ItalicMessages](../runtime/src/plugins/italicMessages/README.md) | Off | No | Makes all text you send italic using *italic* formatting. |
| [LeetSpeak](../runtime/src/plugins/leetSpeak/README.md) | Off | No | Converts letters in your message into classic 1337 digits. |
| [LennyShortcut](../runtime/src/plugins/lennyShortcut/README.md) | Off | No | Turns /lenny into the classic Lenny emoticon before sending. |
| [MarkdownTableMacro](../runtime/src/plugins/markdownTableMacro/README.md) | Off | No | Turns \table2 into a clean two-column comparison table. |
| [MathSymbolsShortcut](../runtime/src/plugins/mathSymbolsShortcut/README.md) | Off | No | Turns !=, <=, >=, +-, and ~= into clean math symbols. |
| [MentionAlertHighlight](../runtime/src/plugins/mentionAlertHighlight/README.md) | Off | No | Highlights incoming messages matching your chosen alert words. |
| [MentionLogger](../runtime/src/plugins/mentionLogger/README.md) | Off | No | Saves @everyone and @here mentions into the Notification Log. |
| [MessageLatency](../runtime/src/plugins/messageLatency/README.md) | Off | No | Shows delivery delay on slow incoming messages. |
| [MessageLogger](../runtime/src/plugins/messageLogger/README.md) | On | Yes | Keeps deleted messages and previous edits visible right in chat. |
| [MessageWhitespaceCleaner](../runtime/src/plugins/messageWhitespaceCleaner/README.md) | Off | No | Removes trailing spaces and extra blank lines before sending. |
| [MirrorWords](../runtime/src/plugins/mirrorWords/README.md) | Off | No | Reverses the order of words in your message before sending. |
| [MockingText](../runtime/src/plugins/mockingText/README.md) | Off | No | Converts text you send into alternating uppercase and lowercase. |
| [MoreKaomoji](../runtime/src/plugins/moreKaomoji/README.md) | Off | No | Turns shortcuts like :shrug:, :tableflip:, :lenny:, and :cat: into text faces. |
| [NoBlockedMessages](../runtime/src/plugins/noBlockedMessages/README.md) | Off | Yes | Hides messages from blocked or ignored users completely. |
| [NoDiscordAutoEmoji](../runtime/src/plugins/noDiscordAutoEmoji/README.md) | Off | No | Keeps :shortcode: text as plain text instead of turning into emojis. |
| [NoEditLabel](../runtime/src/plugins/noEditLabel/README.md) | Off | No | Hides "(edited)" labels on messages while keeping deleted markers. |
| [NoMaskedUrlPaste](../runtime/src/plugins/noMaskedUrlPaste/README.md) | Off | No | Turns hidden [text](link) links into plain visible web links. |
| [NoMassMentions](../runtime/src/plugins/noMassMentions/README.md) | Off | No | Disarms accidental @everyone and @here pings before sending. |
| [NoMosaic](../runtime/src/plugins/noMosaic/README.md) | Off | No | Shows multiple image attachments at full size instead of cropping them into a grid. |
| [NoReplyMention](../runtime/src/plugins/noReplyMention/README.md) | On | No | Turns off @mention pings automatically when you start a reply. |
| [NormalizeUsernames](../runtime/src/plugins/normalizeUsernames/README.md) | Off | No | Removes invisible characters and extra spaces from usernames. |
| [NoServerEmojis](../runtime/src/plugins/noServerEmojis/README.md) | Off | No | Shows custom server emojis as plain :name: text in chat. |
| [NoSuperReactions](../runtime/src/plugins/noSuperReactions/README.md) | Off | No | Shows animated super reactions as regular reactions. |
| [NumberedListFix](../runtime/src/plugins/numberedListFix/README.md) | Off | No | Turns 1) list items into standard 1. numbered lists when sending. |
| [PigLatin](../runtime/src/plugins/pigLatin/README.md) | Off | No | Converts words you send into Pig Latin. |
| [PirateSpeak](../runtime/src/plugins/pirateSpeak/README.md) | Off | No | Adds classic pirate phrasing to everyday words before sending. |
| [ProtectMessageDrafts](../runtime/src/plugins/protectMessageDrafts/README.md) | Off | No | Keeps your unsent typed message drafts from disappearing unexpectedly. |
| [ReplyTimestamp](../runtime/src/plugins/replyTimestamp/README.md) | Off | No | Shows the original message timestamp on reply previews. |
| [RevealAllSpoilers](../runtime/src/plugins/revealAllSpoilers/README.md) | Off | No | Reveals hidden spoiler text and blurred attachments automatically. |
| [ReverseSentences](../runtime/src/plugins/reverseSentences/README.md) | Off | No | Reverses the order of sentences in multi-sentence messages. |
| [ReverseText](../runtime/src/plugins/reverseText/README.md) | Off | No | Reverses your message text while keeping links and mentions intact. |
| [RussianTranslit](../runtime/src/plugins/russianTranslit/README.md) | Off | No | Swaps matching Latin letters with lookalike Cyrillic letters. |
| [RxdditLinks](../runtime/src/plugins/rxdditLinks/README.md) | Off | No | Rewrites reddit.com links to rxddit.com so videos and galleries preview in chat. |
| [SendTimestamps](../runtime/src/plugins/sendTimestamps/README.md) | Off | No | Turns @HH:MM times you type into timezone-aware Discord timestamps. |
| [SentenceCaseFix](../runtime/src/plugins/sentenceCaseFix/README.md) | Off | No | Capitalizes the first letter of every sentence automatically. |
| [ShakespeareSpeak](../runtime/src/plugins/shakespeareSpeak/README.md) | Off | No | Turns everyday greetings and pronouns into Shakespearean English. |
| [ShoutCase](../runtime/src/plugins/shoutCase/README.md) | Off | No | Converts words in your message to ALL CAPS. |
| [ShowAttachmentCount](../runtime/src/plugins/showAttachmentCount/README.md) | Off | No | Shows [N files] next to timestamps when a message has multiple files. |
| [ShowAttachmentSizes](../runtime/src/plugins/showAttachmentSizes/README.md) | Off | No | Shows total attachment size next to message timestamps. |
| [ShowEditedTime](../runtime/src/plugins/showEditedTime/README.md) | Off | No | Shows the exact edit time on edited chat messages. |
| [ShowEmbedCount](../runtime/src/plugins/showEmbedCount/README.md) | Off | No | Shows [N embeds] next to timestamps when a message has multiple previews. |
| [ShowMessageLength](../runtime/src/plugins/showMessageLength/README.md) | Off | No | Shows a character count next to long messages (120+ characters). |
| [ShowMeYourName](../runtime/src/plugins/showMeYourName/README.md) | Off | No | Shows each user’s @username alongside their server nickname in chat. |
| [ShowReplyAuthorBadge](../runtime/src/plugins/showReplyAuthorBadge/README.md) | Off | No | Shows [-> @user] next to timestamps on message replies. |
| [ShowStickerNameBadge](../runtime/src/plugins/showStickerNameBadge/README.md) | Off | No | Shows sticker names next to timestamps on sticker messages. |
| [ShrugShortcut](../runtime/src/plugins/shrugShortcut/README.md) | Off | No | Turns /shrug into the classic shrug face automatically. |
| [SilentMessages](../runtime/src/plugins/silentMessages/README.md) | Off | No | Adds @silent automatically so your messages never trigger sound notifications. |
| [SmallCapsText](../runtime/src/plugins/smallCapsText/README.md) | Off | No | Converts lowercase letters into small capital lettering. |
| [SpaceLetters](../runtime/src/plugins/spaceLetters/README.md) | Off | No | Adds spaces between letters in words you send for emphasis. |
| [SpoilerEveryWord](../runtime/src/plugins/spoilerEveryWord/README.md) | Off | No | Wraps every word you send in individual \|\|spoiler\|\| tags. |
| [SpoilerMessage](../runtime/src/plugins/spoilerMessage/README.md) | Off | No | Wraps your entire outgoing message in \|\|spoiler\|\| tags. |
| [SpoilerUrlsOnSend](../runtime/src/plugins/spoilerUrlsOnSend/README.md) | Off | No | Wraps links you send in \|\|spoiler\|\| tags automatically. |
| [SquareText](../runtime/src/plugins/squareText/README.md) | Off | No | Converts letters in your message into squared block characters. |
| [StrikethroughMessages](../runtime/src/plugins/strikethroughMessages/README.md) | Off | No | Crosses out text you send using ~~strikethrough~~ formatting. |
| [StripMarkdownOnSend](../runtime/src/plugins/stripMarkdownOnSend/README.md) | Off | No | Removes bold, italic, and heading formatting before sending. |
| [StutterText](../runtime/src/plugins/stutterText/README.md) | Off | No | Adds light stutter phrasing to opening words you send. |
| [SuppressEmbedsOnSend](../runtime/src/plugins/suppressEmbedsOnSend/README.md) | Off | No | Hides automatic link preview boxes on links you send. |
| [TableflipShortcut](../runtime/src/plugins/tableflipShortcut/README.md) | Off | No | Turns /tableflip into the classic table flip face. |
| [TextReplace](../runtime/src/plugins/textReplace/README.md) | Off | No | Expands classic text faces like :shrug:, :tableflip:, and :lenny:. |
| [TitleCaseChat](../runtime/src/plugins/titleCaseChat/README.md) | Off | No | Capitalizes the first letter of every word you send. |
| [TrimBlankLinesOnSend](../runtime/src/plugins/trimBlankLinesOnSend/README.md) | Off | No | Removes extra blank lines at the top and bottom before sending. |
| [UnderlineMessages](../runtime/src/plugins/underlineMessages/README.md) | Off | No | Underlines text you send using __underline__ formatting. |
| [UnflipShortcut](../runtime/src/plugins/unflipShortcut/README.md) | Off | No | Turns /unflip into the upright table emoticon. |
| [Unindent](../runtime/src/plugins/unindent/README.md) | Off | No | Removes extra leading spaces from pasted code blocks before sending. |
| [UnsuppressEmbeds](../runtime/src/plugins/unsuppressEmbeds/README.md) | Off | No | Keeps hidden link preview boxes visible in chat. |
| [UnwrapAngleUrls](../runtime/src/plugins/unwrapAngleUrls/README.md) | Off | No | Removes <...> brackets around links you send so previews appear. |
| [UpsideDownText](../runtime/src/plugins/upsideDownText/README.md) | Off | No | Flips text you send upside down outside links and code blocks. |
| [UwUify](../runtime/src/plugins/uwuify/README.md) | Off | No | Makes messages cute and playful while keeping links and mentions intact. |
| [ValidReply](../runtime/src/plugins/validReply/README.md) | Off | No | Marks replies whose original message was deleted or cannot be loaded. |
| [ValidUser](../runtime/src/plugins/validUser/README.md) | Off | No | Replaces raw user ID mentions in chat with real @usernames. |
| [VaporwaveText](../runtime/src/plugins/vaporwaveText/README.md) | Off | No | Converts text you send into wide fullwidth vaporwave letters. |
| [VxTikTokLinks](../runtime/src/plugins/vxTikTokLinks/README.md) | Off | No | Rewrites TikTok links to vxtiktok.com so videos play reliably in chat. |
| [VxTwitterLinks](../runtime/src/plugins/vxTwitterLinks/README.md) | Off | No | Rewrites x.com and twitter.com links to vxtwitter.com for smooth video previews. |
| [WhisperCase](../runtime/src/plugins/whisperCase/README.md) | Off | No | Converts words in your message to lowercase. |
| [WordCounter](../runtime/src/plugins/wordCounter/README.md) | Off | No | Shows word counts on long messages or adds them when sending. |
| [ZalgoLite](../runtime/src/plugins/zalgoLite/README.md) | Off | No | Adds light glitch accents to words you send. |

## UI (74)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysExpandRoles](../runtime/src/plugins/alwaysExpandRoles/README.md) | Off | No | Shows all role badges on profiles without needing to tap "+N". |
| [AutoClearCustomStatus](../runtime/src/plugins/autoClearCustomStatus/README.md) | Off | No | Clears leftover custom status text when turned on at startup. |
| [BetterRoleDot](../runtime/src/plugins/betterRoleDot/README.md) | Off | No | Always shows role color dots and colored names on chat messages. |
| [ColorSighted](../runtime/src/plugins/colorSighted/README.md) | Off | No | Shows regular round status circles instead of accessibility shapes. |
| [CompactBotMessages](../runtime/src/plugins/compactBotMessages/README.md) | Off | No | Removes extra blank lines inside long bot messages. |
| [CompactReactionRow](../runtime/src/plugins/compactReactionRow/README.md) | Off | No | Limits visible reactions per message to six so chat stays tidy. |
| [CustomEmbedColorAccent](../runtime/src/plugins/customEmbedColorAccent/README.md) | Off | No | Adds a colored accent stripe next to pinned or bot messages. |
| [CustomRPC](../runtime/src/plugins/customRPC/README.md) | Off | No | Shows a custom status activity (Playing, Streaming, Listening, Watching) on your profile. |
| [DefaultUserAvatars](../runtime/src/plugins/defaultUserAvatars/README.md) | Off | No | Replaces custom profile pictures with simple default Discord avatars. |
| [DimBotAttachments](../runtime/src/plugins/dimBotAttachments/README.md) | Off | No | Slightly dims images and files sent by bots. |
| [DisableUploadPreview](../runtime/src/plugins/disableUploadPreview/README.md) | Off | No | Hides large file preview cards in chat. |
| [ForceOwnerCrown](../runtime/src/plugins/forceOwnerCrown/README.md) | Off | No | Always shows the crown icon next to server owners even if hidden. |
| [GreetStickerPicker](../runtime/src/plugins/greetStickerPicker/README.md) | Off | No | Hides the "Wave to say hi!" sticker button in empty DMs and channels. |
| [HideActivityInvites](../runtime/src/plugins/hideActivityInvites/README.md) | Off | No | Hides game and Spotify party invite boxes in chat. |
| [HideAppsButton](../runtime/src/plugins/hideAppsButton/README.md) | Off | Yes | Hides the Apps and Commands button next to the message bar. |
| [HideBlockedReplies](../runtime/src/plugins/hideBlockedReplies/README.md) | Off | No | Hides reply preview bars above replies to blocked users. |
| [HideBlockedTyping](../runtime/src/plugins/hideBlockedTyping/README.md) | Off | No | Hides typing indicators from blocked or ignored users. |
| [HideBoostMessages](../runtime/src/plugins/hideBoostMessages/README.md) | Off | No | Hides server boost system announcements in chat. |
| [HideBotCommandsHeader](../runtime/src/plugins/hideBotCommandsHeader/README.md) | Off | No | Hides "used /command" headers above bot replies. |
| [HideCallBanners](../runtime/src/plugins/hideCallBanners/README.md) | Off | No | Hides missed and started call boxes inside DM chats. |
| [HideChannelNotices](../runtime/src/plugins/hideChannelNotices/README.md) | Off | No | Dismisses noisy channel notices and server tip banners. |
| [HideChannelPrompts](../runtime/src/plugins/hideChannelPrompts/README.md) | Off | No | Hides wave-to-say-hi and conversation starter prompt boxes. |
| [HideEmbedAuthors](../runtime/src/plugins/hideEmbedAuthors/README.md) | Off | No | Hides redundant author headers inside link preview boxes. |
| [HideEmbedFields](../runtime/src/plugins/hideEmbedFields/README.md) | Off | No | Hides extra detail columns inside bot preview cards. |
| [HideEmbedFooters](../runtime/src/plugins/hideEmbedFooters/README.md) | Off | No | Hides extra footer lines at the bottom of link preview boxes. |
| [HideEmbeds](../runtime/src/plugins/hideEmbeds/README.md) | Off | No | Hides all link and card preview boxes under messages. |
| [HideEmptyEmbeds](../runtime/src/plugins/hideEmptyEmbeds/README.md) | Off | No | Hides blank preview boxes on chat messages. |
| [HideForwardHeaders](../runtime/src/plugins/hideForwardHeaders/README.md) | Off | No | Hides the "Forwarded" banner above forwarded messages. |
| [HideGiftButton](../runtime/src/plugins/hideGiftButton/README.md) | Off | Yes | Hides the Nitro gift button from the chat message bar. |
| [HideGiftIntents](../runtime/src/plugins/hideGiftIntents/README.md) | Off | No | Hides birthday and Nitro gift prompt banners in chat. |
| [HideInviteCards](../runtime/src/plugins/hideInviteCards/README.md) | Off | No | Hides server invite preview boxes inside chat messages. |
| [HideJoinMessages](../runtime/src/plugins/hideJoinMessages/README.md) | Off | No | Hides server member welcome system messages in chat. |
| [HideMediaAttachments](../runtime/src/plugins/hideMediaAttachments/README.md) | Off | No | Hides uploaded media and file boxes in chat. |
| [HideMessageComponents](../runtime/src/plugins/hideMessageComponents/README.md) | Off | No | Hides bot button and dropdown rows under messages. |
| [HidePinnedNotices](../runtime/src/plugins/hidePinnedNotices/README.md) | Off | No | Hides "pinned a message to this channel" system alerts in chat. |
| [HidePolls](../runtime/src/plugins/hidePolls/README.md) | Off | No | Hides poll cards from chat. |
| [HidePollVoteCounts](../runtime/src/plugins/hidePollVoteCounts/README.md) | Off | No | Hides poll vote counts while voting is open. |
| [HidePostPreviews](../runtime/src/plugins/hidePostPreviews/README.md) | Off | No | Hides forum post preview cards inside messages. |
| [HidePronouns](../runtime/src/plugins/hidePronouns/README.md) | Off | Yes | Hides pronoun labels on user profiles. |
| [HideReactions](../runtime/src/plugins/hideReactions/README.md) | Off | No | Hides emoji reaction buttons beneath chat messages. |
| [HideServerTagBadges](../runtime/src/plugins/hideServerTagBadges/README.md) | Off | No | Hides server tag pills next to usernames in chat. |
| [HideStickerLabels](../runtime/src/plugins/hideStickerLabels/README.md) | Off | No | Hides sticker description labels below chat stickers. |
| [HideThreadCards](../runtime/src/plugins/hideThreadCards/README.md) | Off | No | Hides thread summary cards inside channels. |
| [HideThreadCreatedRows](../runtime/src/plugins/hideThreadCreatedRows/README.md) | Off | No | Hides "started a thread" system messages in chat. |
| [HideUserBanners](../runtime/src/plugins/hideUserBanners/README.md) | Off | Yes | Hides custom Nitro profile banners on user profiles. |
| [HideUserBios](../runtime/src/plugins/hideUserBios/README.md) | Off | Yes | Hides custom About Me bios on opened user profiles. |
| [HideVoiceChannelBadges](../runtime/src/plugins/hideVoiceChannelBadges/README.md) | Off | No | Hides "In Voice" badges beside names in chat. |
| [HideWebhookBadges](../runtime/src/plugins/hideWebhookBadges/README.md) | Off | No | Hides APP and BOT tags beside webhook usernames. |
| [LoadingQuotes](../runtime/src/plugins/loadingQuotes/README.md) | Off | No | Replaces Discord loading screen tips with cozy Nekocord quotes. |
| [MemberCount](../runtime/src/plugins/memberCount/README.md) | Off | No | Shows live online and total member counts in servers. |
| [NekocordSettingsUI](../runtime/src/plugins/nekocordSettingsUI/README.md) | On | No | Adds Nekocord, Plugins, Themes, Notification Log, Updater, and Backup to Discord Settings. |
| [NoAvatarDecorations](../runtime/src/plugins/noAvatarDecorations/README.md) | Off | No | Hides Nitro avatar decorations on messages and user profiles. |
| [NoBotBadges](../runtime/src/plugins/noBotBadges/README.md) | Off | No | Hides BOT, APP, and webhook labels beside usernames. |
| [NoClanTags](../runtime/src/plugins/noClanTags/README.md) | Off | No | Hides server tag badges beside usernames in chat. |
| [NoConnectionsRoleTag](../runtime/src/plugins/noConnectionsRoleTag/README.md) | Off | No | Hides linked account badges beside usernames in chat. |
| [NoEmbedThumbnails](../runtime/src/plugins/noEmbedThumbnails/README.md) | Off | No | Hides thumbnails and preview pictures inside link embed cards. |
| [NoInlineForwardButton](../runtime/src/plugins/noInlineForwardButton/README.md) | Off | No | Hides the quick forward button shown next to chat messages. |
| [NoLinkDecorations](../runtime/src/plugins/noLinkDecorations/README.md) | Off | No | Hides extra link icons beside links in chat messages. |
| [NoOnboardingDelay](../runtime/src/plugins/noOnboardingDelay/README.md) | Off | No | Skips countdown delays on server onboarding screens. |
| [NoOpTag](../runtime/src/plugins/noOpTag/README.md) | Off | No | Hides the "OP" author tag inside forum threads. |
| [NoPendingCount](../runtime/src/plugins/noPendingCount/README.md) | Off | Yes | Hides pending friend request and message request count badges. |
| [NoProfileEffects](../runtime/src/plugins/noProfileEffects/README.md) | Off | Yes | Hides animated Nitro profile effects on user profiles. |
| [NoProfileThemes](../runtime/src/plugins/noProfileThemes/README.md) | Off | Yes | Hides custom Nitro profile colors so profiles match your theme. |
| [NoRoleColors](../runtime/src/plugins/noRoleColors/README.md) | Off | No | Shows all chat usernames in default text color instead of role colors. |
| [NoRoleGradient](../runtime/src/plugins/noRoleGradient/README.md) | Off | No | Turns multi-color username gradients into a single solid color. |
| [NoRoleIcons](../runtime/src/plugins/noRoleIcons/README.md) | Off | No | Hides role icons beside usernames in chat. |
| [NoStickerAutoSuggest](../runtime/src/plugins/noStickerAutoSuggest/README.md) | Off | No | Stops sticker suggestion popups while you type. |
| [NoTypingAnimation](../runtime/src/plugins/noTypingAnimation/README.md) | Off | No | Stops typing indicator dots from bouncing in chat. |
| [NoUnblockToJump](../runtime/src/plugins/noUnblockToJump/README.md) | Off | No | Lets you jump directly to a blocked user’s message without confirming. |
| [OnlyMyReactions](../runtime/src/plugins/onlyMyReactions/README.md) | Off | No | Shows only emoji reactions that you added yourself. |
| [PlainFolderIcon](../runtime/src/plugins/plainFolderIcon/README.md) | Off | No | Shows simple folder icons instead of miniature server grids. |
| [RoleColorEverywhere](../runtime/src/plugins/roleColorEverywhere/README.md) | Off | No | Colors usernames with their highest role color across chat messages. |
| [ShowFullSnowflakeDate](../runtime/src/plugins/showFullSnowflakeDate/README.md) | Off | No | Shows the (YYYY-MM-DD) date next to short chat timestamps. |
| [ShowTimeoutDuration](../runtime/src/plugins/showTimeoutDuration/README.md) | Off | No | Shows remaining timeout duration beside timed-out members in chat. |

## Privacy (73)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AnonymiseFileNames](../runtime/src/plugins/anonymiseFileNames/README.md) | Off | No | Renames files you upload to random 8-character names for privacy. |
| [AnonymiseLinks](../runtime/src/plugins/anonymiseLinks/README.md) | Off | No | Removes tracking info from links you send, with an optional privacy prefix. |
| [AutoSpoilerAttachments](../runtime/src/plugins/autoSpoilerAttachments/README.md) | Off | No | Marks uploaded images, videos, or files as spoilers automatically. |
| [BlockActivityStatus](../runtime/src/plugins/blockActivityStatus/README.md) | Off | No | Stops Discord from sharing your running games and app activity. |
| [BlockCallTelemetry](../runtime/src/plugins/blockCallTelemetry/README.md) | Off | No | Stops Discord from collecting call quality stats and metrics. |
| [BlockCrashReports](../runtime/src/plugins/blockCrashReports/README.md) | Off | No | Stops Discord from sending automatic crash reports. |
| [BlockExperimentExposures](../runtime/src/plugins/blockExperimentExposures/README.md) | Off | No | Stops Discord from reporting which test features you are exposed to. |
| [BlockTypingDispatch](../runtime/src/plugins/blockTypingDispatch/README.md) | Off | No | Stops Discord from sending typing status updates from your device. |
| [CleanAliExpressLinks](../runtime/src/plugins/cleanAliExpressLinks/README.md) | Off | No | Removes tracking tags from AliExpress item links you send. |
| [CleanAmazonLinks](../runtime/src/plugins/cleanAmazonLinks/README.md) | Off | No | Shortens Amazon links to clean product pages without tracking. |
| [CleanAppleMusicLinks](../runtime/src/plugins/cleanAppleMusicLinks/README.md) | Off | No | Removes tracking tags from Apple Music links you send. |
| [CleanBilibiliLinks](../runtime/src/plugins/cleanBilibiliLinks/README.md) | Off | No | Removes tracking tags from Bilibili links before sending. |
| [CleanFacebookLinks](../runtime/src/plugins/cleanFacebookLinks/README.md) | Off | No | Removes Facebook tracking tags from links you send. |
| [CleanFigmaLinks](../runtime/src/plugins/cleanFigmaLinks/README.md) | Off | No | Cleans temporary share tokens from Figma file links. |
| [CleanGoogleDocsLinks](../runtime/src/plugins/cleanGoogleDocsLinks/README.md) | Off | No | Removes extra sharing tags from Google Docs and Drive links. |
| [CleanInstagramShare](../runtime/src/plugins/cleanInstagramShare/README.md) | Off | No | Removes Instagram share tracking tags from links you send. |
| [CleanLinkedinLinks](../runtime/src/plugins/cleanLinkedinLinks/README.md) | Off | No | Removes LinkedIn tracking and referral tags from links you send. |
| [CleanMediumLinks](../runtime/src/plugins/cleanMediumLinks/README.md) | Off | No | Removes referral tags from Medium article links. |
| [CleanNotionLinks](../runtime/src/plugins/cleanNotionLinks/README.md) | Off | No | Removes session tracking tags from Notion page links. |
| [CleanPinterestLinks](../runtime/src/plugins/cleanPinterestLinks/README.md) | Off | No | Removes invite and sender tracking tags from Pinterest links. |
| [CleanRedditShareLinks](../runtime/src/plugins/cleanRedditShareLinks/README.md) | Off | No | Removes share and referral tracking tags from Reddit links. |
| [CleanShopeeLinks](../runtime/src/plugins/cleanShopeeLinks/README.md) | Off | No | Removes tracking junk from Shopee product share links. |
| [CleanSoundCloudLinks](../runtime/src/plugins/cleanSoundCloudLinks/README.md) | Off | No | Removes tracking tags from SoundCloud links you send. |
| [CleanSpotifyLinks](../runtime/src/plugins/cleanSpotifyLinks/README.md) | Off | No | Removes share tracking tags from Spotify links you send. |
| [CleanSubstackLinks](../runtime/src/plugins/cleanSubstackLinks/README.md) | Off | No | Removes newsletter tracking tags from Substack links you send. |
| [CleanThreadsParams](../runtime/src/plugins/cleanThreadsParams/README.md) | Off | No | Removes share tracking tags from Threads links you send. |
| [CleanTiktokLinks](../runtime/src/plugins/cleanTiktokLinks/README.md) | Off | No | Removes share tracking tags from TikTok links before sending. |
| [CleanTokopediaLinks](../runtime/src/plugins/cleanTokopediaLinks/README.md) | Off | No | Removes tracking junk from Tokopedia product links you send. |
| [CleanTwitchLinks](../runtime/src/plugins/cleanTwitchLinks/README.md) | Off | No | Removes referral tags from Twitch links you send. |
| [CleanTwitterParams](../runtime/src/plugins/cleanTwitterParams/README.md) | Off | No | Removes share tracking tags from X and Twitter links you send. |
| [CleanYoutubeTracking](../runtime/src/plugins/cleanYoutubeTracking/README.md) | Off | No | Removes tracking tags from YouTube share links. |
| [CleanZeroWidthSend](../runtime/src/plugins/cleanZeroWidthSend/README.md) | Off | No | Removes hidden invisible characters from messages you send. |
| [ClearURLs](../runtime/src/plugins/clearUrls/README.md) | On | No | Removes hidden tracking tags from links you send. |
| [CustomIdle](../runtime/src/plugins/customIdle/README.md) | Off | No | Stops Discord from marking you Idle while away. |
| [FlagSuspiciousDownloads](../runtime/src/plugins/flagSuspiciousDownloads/README.md) | Off | No | Shows a warning label on messages carrying suspicious file downloads. |
| [ForceHttpsLinks](../runtime/src/plugins/forceHttpsLinks/README.md) | Off | No | Upgrades insecure http:// links to https:// before sending. |
| [FriendRemovedAudit](../runtime/src/plugins/friendRemovedAudit/README.md) | Off | No | Records when someone removes you from their friends list. |
| [GuildLeaveAudit](../runtime/src/plugins/guildLeaveAudit/README.md) | Off | No | Tracks when you leave or get removed from a server. |
| [HideSafetyNotices](../runtime/src/plugins/hideSafetyNotices/README.md) | Off | No | Hides Discord safety warning banners inside chat. |
| [HideTypingInDMs](../runtime/src/plugins/hideTypingInDMs/README.md) | Off | No | Stops people in DMs from seeing when you are typing. |
| [IgnoreActivities](../runtime/src/plugins/ignoreActivities/README.md) | Off | No | Keeps running games and rich presence private on your device. |
| [ImplicitRelationships](../runtime/src/plugins/implicitRelationships/README.md) | Off | No | Keeps a local list of friends you DM or call most often. |
| [InvidiousLinks](../runtime/src/plugins/invidiousLinks/README.md) | Off | No | Rewrites YouTube links to privacy-friendly yewtu.be viewing links. |
| [KeywordBlocker](../runtime/src/plugins/keywordBlocker/README.md) | Off | No | Hides incoming messages containing words from your blocklist. |
| [LibredditLinks](../runtime/src/plugins/libredditLinks/README.md) | Off | No | Converts Reddit links into clean Redlib reading links. |
| [MuteNewGuild](../runtime/src/plugins/muteNewGuild/README.md) | Off | No | Automatically mutes notifications and pings when you join a new server. |
| [MutualGroupDMs](../runtime/src/plugins/mutualGroupDMs/README.md) | Off | No | Finds shared group DMs with other users locally. |
| [NitterLinks](../runtime/src/plugins/nitterLinks/README.md) | Off | No | Rewrites Twitter and X links to an anonymous Nitter mirror. |
| [NoAnalyticsBeacons](../runtime/src/plugins/noAnalyticsBeacons/README.md) | Off | Yes | Stops Discord from sending view counts and background tracking signals. |
| [NoDevtoolsWarning](../runtime/src/plugins/noDevtoolsWarning/README.md) | Off | No | Hides Discord warning banners in the developer console. |
| [NoGiftSuggestions](../runtime/src/plugins/noGiftSuggestions/README.md) | Off | No | Hides Nitro gift buttons and upgrade suggestions. |
| [NoPresenceTelemetry](../runtime/src/plugins/noPresenceTelemetry/README.md) | Off | No | Stops Discord from tracking your active games and presence. |
| [NoTrack](../runtime/src/plugins/noTrack/README.md) | On | No | Stops Discord from tracking your activity and collecting analytics. |
| [OnePingPerDM](../runtime/src/plugins/onePingPerDM/README.md) | Off | No | Prevents repeated sound pings from the same DM within 10 seconds. |
| [PauseInvitesForever](../runtime/src/plugins/pauseInvitesForever/README.md) | Off | No | Keeps server invite pauses active without short timers. |
| [RedactApiKeys](../runtime/src/plugins/redactApiKeys/README.md) | Off | No | Automatically hides pasted API keys before you send a message. |
| [RedactAwsKeys](../runtime/src/plugins/redactAwsKeys/README.md) | Off | No | Automatically hides pasted AWS access keys before sending. |
| [RedactBearerTokens](../runtime/src/plugins/redactBearerTokens/README.md) | Off | No | Automatically hides Bearer secret keys before sending. |
| [RedactCreditCards](../runtime/src/plugins/redactCreditCards/README.md) | Off | No | Automatically hides payment card numbers before sending. |
| [RedactDiscordTokens](../runtime/src/plugins/redactDiscordTokens/README.md) | Off | No | Automatically hides pasted Discord account tokens before sending. |
| [RedactEmails](../runtime/src/plugins/redactEmails/README.md) | Off | No | Automatically hides email addresses before sending messages. |
| [RedactEnvSecrets](../runtime/src/plugins/redactEnvSecrets/README.md) | Off | No | Automatically hides pasted .env secrets and passwords before sending. |
| [RedactIpv4Addresses](../runtime/src/plugins/redactIpv4Addresses/README.md) | Off | No | Automatically hides public IP addresses before sending messages. |
| [RedactJwtTokens](../runtime/src/plugins/redactJwtTokens/README.md) | Off | No | Automatically hides secret login tokens before sending. |
| [RedactPhoneNumbers](../runtime/src/plugins/redactPhoneNumbers/README.md) | Off | No | Automatically hides phone numbers in messages you send. |
| [RedactPrivateKeys](../runtime/src/plugins/redactPrivateKeys/README.md) | Off | No | Automatically hides pasted private keys before sending. |
| [SilentChannelSelect](../runtime/src/plugins/silentChannelSelect/README.md) | Off | No | Stops Discord from tracking which channels and threads you visit. |
| [SilentTyping](../runtime/src/plugins/silentTyping/README.md) | Off | No | Hides your typing status from everyone on Discord. |
| [SortFriendRequests](../runtime/src/plugins/sortFriendRequests/README.md) | Off | No | Sorts pending friend requests with the newest requests at the top. |
| [StripExifFileNames](../runtime/src/plugins/stripExifFileNames/README.md) | Off | No | Replaces camera-stamped filenames (IMG_, PXL_, DSC_) with generic names. |
| [StripReferralUpsells](../runtime/src/plugins/stripReferralUpsells/README.md) | Off | No | Blocks Nitro friend referral popups and banners. |
| [SuppressReadReceipts](../runtime/src/plugins/suppressReadReceipts/README.md) | Off | Yes | Stops Discord from marking messages as read when browsing channels. |
| [YoutubeNoCookie](../runtime/src/plugins/youtubeNoCookie/README.md) | Off | No | Rewrites YouTube links to privacy-friendly youtube-nocookie.com. |

## Utility (50)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysTrust](../runtime/src/plugins/alwaysTrust/README.md) | Off | Yes | Automatically trusts external links and skips untrusted domain warning prompts. |
| [AmpLinkCleaner](../runtime/src/plugins/ampLinkCleaner/README.md) | Off | No | Removes AMP mobile formatting parts from shared article links. |
| [AutoPeriod](../runtime/src/plugins/autoPeriod/README.md) | Off | No | Adds a period to the end of sentences you send if missing. |
| [BetterSteamLinks](../runtime/src/plugins/betterSteamLinks/README.md) | Off | No | Removes extra referral junk from Steam store links. |
| [BreezeWikiLinks](../runtime/src/plugins/breezeWikiLinks/README.md) | Off | No | Converts ad-heavy Fandom wiki links into clean BreezeWiki reading links. |
| [CleanDuckDuckGoLinks](../runtime/src/plugins/cleanDuckDuckGoLinks/README.md) | Off | No | Unwraps DuckDuckGo redirect links into direct website links. |
| [CleanEbayLinks](../runtime/src/plugins/cleanEbayLinks/README.md) | Off | No | Shortens eBay item links without extra tracking junk. |
| [CleanGoogleSearchLinks](../runtime/src/plugins/cleanGoogleSearchLinks/README.md) | Off | No | Unwraps Google redirect links directly to the real destination. |
| [CollapseSpaces](../runtime/src/plugins/collapseSpaces/README.md) | Off | No | Turns multiple spaces between words into single spaces. |
| [CountdownTimestampMacro](../runtime/src/plugins/countdownTimestampMacro/README.md) | Off | No | Turns \in10m, \in2h, or \in3d into live Discord countdown timers. |
| [DesktopWikipediaLinks](../runtime/src/plugins/desktopWikipediaLinks/README.md) | Off | No | Converts mobile Wikipedia links into standard desktop Wikipedia links. |
| [DiscordDateMacro](../runtime/src/plugins/discordDateMacro/README.md) | Off | No | Turns \today into a Discord date tag that adjusts to every timezone. |
| [ExpandShortYoutuBe](../runtime/src/plugins/expandShortYoutuBe/README.md) | Off | No | Expands short youtu.be links into full youtube.com watch links. |
| [FixBilibiliEmbeds](../runtime/src/plugins/fixBilibiliEmbeds/README.md) | Off | No | Converts bilibili.com links so videos play directly inside Discord chat. |
| [FriendRequestLogger](../runtime/src/plugins/friendRequestLogger/README.md) | Off | No | Logs incoming and accepted friend requests in the Notification Log. |
| [FullTimestampMacro](../runtime/src/plugins/fullTimestampMacro/README.md) | Off | No | Turns \fulltime into a full localized Discord date and time tag. |
| [FxEmbedsBluesky](../runtime/src/plugins/fxEmbedsBluesky/README.md) | Off | No | Converts bsky.app links to fxbsky.app for better rich previews. |
| [GiphyCleanLinks](../runtime/src/plugins/giphyCleanLinks/README.md) | Off | No | Removes tracking tags from Giphy GIF links. |
| [GuildJoinLogger](../runtime/src/plugins/guildJoinLogger/README.md) | Off | No | Logs newly joined servers in the Nekocord Notification Log. |
| [ImdbCleanLinks](../runtime/src/plugins/imdbCleanLinks/README.md) | Off | No | Removes referral tracking tags from IMDb links. |
| [ImgurDirectCleanLinks](../runtime/src/plugins/imgurDirectCleanLinks/README.md) | Off | No | Removes tracking noise from Imgur image and album links. |
| [IsoDateMacro](../runtime/src/plugins/isoDateMacro/README.md) | Off | No | Turns /today into today’s date in YYYY-MM-DD format. |
| [KeepCurrentChannel](../runtime/src/plugins/keepCurrentChannel/README.md) | Off | No | Remembers your last opened server channel and DM across screen switches. |
| [KickCleanLinks](../runtime/src/plugins/kickCleanLinks/README.md) | Off | No | Removes tracking tags from Kick stream and clip links. |
| [MobileTwitterToX](../runtime/src/plugins/mobileTwitterToX/README.md) | Off | No | Converts mobile.twitter.com links into standard x.com links. |
| [MobileWikipediaToDesktop](../runtime/src/plugins/mobileWikipediaToDesktop/README.md) | Off | No | Converts mobile Wikipedia links into standard desktop links. |
| [MorseCodeMacro](../runtime/src/plugins/morseCodeMacro/README.md) | Off | No | Turns /morse <text> into Morse code dots and dashes. |
| [NSFWGateBypass](../runtime/src/plugins/nsfwGateBypass/README.md) | Off | Yes | Bypasses age-gate confirmation screens on your device. |
| [OldRedditLinks](../runtime/src/plugins/oldRedditLinks/README.md) | Off | No | Rewrites reddit.com links to classic old.reddit.com. |
| [OverrideForumDefaults](../runtime/src/plugins/overrideForumDefaults/README.md) | Off | No | Sorts forum channels by latest activity by default. |
| [PermissionFreeWill](../runtime/src/plugins/permissionFreeWill/README.md) | Off | No | Lets you view locked channel and member permission screens. |
| [PresenceLogger](../runtime/src/plugins/presenceLogger/README.md) | Off | No | Saves friend online/idle/DND/offline status changes to Notification Log. |
| [QuickMathEval](../runtime/src/plugins/quickMathEval/README.md) | Off | No | Solves /calc <math> equations directly when sending a message. |
| [QuickSnippetMacros](../runtime/src/plugins/quickSnippetMacros/README.md) | Off | No | Replaces \s1 and \s2 shortcuts with your saved quick phrases. |
| [RandomPasswordMacro](../runtime/src/plugins/randomPasswordMacro/README.md) | Off | No | Turns \pass into a random 16-character spoiler-tagged password. |
| [RelationshipNotifier](../runtime/src/plugins/relationshipNotifier/README.md) | Off | No | Alerts you when friends remove you or when you leave/get kicked from servers. |
| [ReplaceGoogleSearch](../runtime/src/plugins/replaceGoogleSearch/README.md) | Off | No | Rewrites Google Search links to DuckDuckGo privacy search links. |
| [Rot13Macro](../runtime/src/plugins/rot13Macro/README.md) | Off | No | Scrambles /rot13 <text> messages using ROT13 letter shifting. |
| [ShowAttachmentAltText](../runtime/src/plugins/showAttachmentAltText/README.md) | Off | No | Shows image alt-text descriptions under images in chat. |
| [ShowHiddenChannels](../runtime/src/plugins/showHiddenChannels/README.md) | Off | No | Shows hidden channels in server channel lists (names and topics only). |
| [ShowHiddenThings](../runtime/src/plugins/showHiddenThings/README.md) | Off | No | Shows hidden developer settings and badges inside Discord. |
| [SmartDashes](../runtime/src/plugins/smartDashes/README.md) | Off | No | Turns -- and ... into smooth dashes and ellipsis characters. |
| [SmartQuotes](../runtime/src/plugins/smartQuotes/README.md) | Off | No | Turns plain straight quotes into balanced curly quotation marks. |
| [StripYoutubeShorts](../runtime/src/plugins/stripYoutubeShorts/README.md) | Off | No | Converts YouTube Shorts links into normal YouTube video links. |
| [TempConvertMacro](../runtime/src/plugins/tempConvertMacro/README.md) | Off | No | Turns \25C or \77F into both Celsius and Fahrenheit. |
| [TenorCleanLinks](../runtime/src/plugins/tenorCleanLinks/README.md) | Off | No | Removes extra share tracking tags from Tenor GIF links. |
| [TrimTrailingSpaces](../runtime/src/plugins/trimTrailingSpaces/README.md) | Off | No | Removes extra blank lines and stray spaces before sending. |
| [UuidGeneratorMacro](../runtime/src/plugins/uuidGeneratorMacro/README.md) | Off | No | Turns \uuid into a random unique ID before sending. |
| [WikiwandToWikipedia](../runtime/src/plugins/wikiwandToWikipedia/README.md) | Off | No | Converts Wikiwand links back into standard Wikipedia links. |
| [WordCountMacro](../runtime/src/plugins/wordCountMacro/README.md) | Off | No | Turns \wc into [N words] counted from your message. |

## Developer (30)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AutoCodeBlock](../runtime/src/plugins/autoCodeBlock/README.md) | Off | No | Wraps pasted multi-line logs and JSON text into code blocks automatically. |
| [Base64DecodeMacro](../runtime/src/plugins/base64DecodeMacro/README.md) | Off | No | Decodes /unb64 <text> from Base64 back into readable text before sending. |
| [Base64EncodeMacro](../runtime/src/plugins/base64EncodeMacro/README.md) | Off | No | Encodes /b64 <text> into Base64 format before sending. |
| [BinaryEncodeMacro](../runtime/src/plugins/binaryEncodeMacro/README.md) | Off | No | Turns /bin <text> into binary ones and zeros before sending. |
| [BlockDebugTelemetry](../runtime/src/plugins/blockDebugTelemetry/README.md) | Off | No | Stops Discord from sending background debug and speed logs. |
| [BypassSlowmodeDisplay](../runtime/src/plugins/bypassSlowmodeDisplay/README.md) | Off | Yes | Hides the client-side slowmode countdown lock on message boxes. |
| [ByteSizeMacro](../runtime/src/plugins/byteSizeMacro/README.md) | Off | No | Adds exact byte length to text starting with \bytes:. |
| [CamelCaseMacro](../runtime/src/plugins/camelCaseMacro/README.md) | Off | No | Converts \camel:<words> shortcuts into camelCase text when sending. |
| [CharacterCountTag](../runtime/src/plugins/characterCountTag/README.md) | Off | No | Adds a small character count note to longer messages you send. |
| [CopyableChannelIdMacro](../runtime/src/plugins/copyableChannelIdMacro/README.md) | Off | No | Turns \cid into the current chat channel ID when sending. |
| [DeveloperMode](../runtime/src/plugins/developerMode/README.md) | On | Yes | Turns on Discord Developer Mode so you can copy message, user, and server IDs. |
| [EpochDecodeMacro](../runtime/src/plugins/epochDecodeMacro/README.md) | Off | No | Turns \epoch:<seconds> into a readable UTC date and time. |
| [Experiments](../runtime/src/plugins/experiments/README.md) | Off | Yes | Unlocks Discord hidden Experiments and Staff developer menus in Settings. |
| [HexColorPreviewTag](../runtime/src/plugins/hexColorPreviewTag/README.md) | Off | No | Turns \hex:#RRGGBB into both hex and RGB color info when sending. |
| [HexEncodeMacro](../runtime/src/plugins/hexEncodeMacro/README.md) | Off | No | Turns /hex <text> into hexadecimal numbers before sending. |
| [InspectMessageIdBadge](../runtime/src/plugins/inspectMessageIdBadge/README.md) | Off | No | Shows the last 6 digits of each message ID next to its timestamp. |
| [JsonFormatMacro](../runtime/src/plugins/jsonFormatMacro/README.md) | Off | No | Formats \json:{...} text into a clean code block when sending. |
| [JsonMinifyMacro](../runtime/src/plugins/jsonMinifyMacro/README.md) | Off | No | Compresses \jmin:{...} text onto a single compact line when sending. |
| [LoremIpsumMacro](../runtime/src/plugins/loremIpsumMacro/README.md) | Off | No | Turns /lorem into sample placeholder text. |
| [MonospaceNumbers](../runtime/src/plugins/monospaceNumbers/README.md) | Off | No | Converts numbers in your message into fixed-width digits. |
| [ReactErrorDecoder](../runtime/src/plugins/reactErrorDecoder/README.md) | Off | No | Shows readable explanations if Discord encounters an app UI error. |
| [RegexEscapeMacro](../runtime/src/plugins/regexEscapeMacro/README.md) | Off | No | Escapes special search characters in \re:<text> before sending. |
| [SlugifyMacro](../runtime/src/plugins/slugifyMacro/README.md) | Off | No | Turns \slug:<text> into clean hyphenated text (like my-slug-text). |
| [SnakeCaseMacro](../runtime/src/plugins/snakeCaseMacro/README.md) | Off | No | Turns \snake:<words> into underscore_joined words when sending. |
| [SnowflakeAgeBadge](../runtime/src/plugins/snowflakeAgeBadge/README.md) | Off | No | Shows how old a message is (like 2h ago) beside its timestamp. |
| [SnowflakeIdsInChat](../runtime/src/plugins/snowflakeIdsInChat/README.md) | Off | No | Shows full message ID numbers next to message headers. |
| [UnixNowMacro](../runtime/src/plugins/unixNowMacro/README.md) | Off | No | Turns /unixnow into a Discord live timestamp for the current time. |
| [UnixTimestamps](../runtime/src/plugins/unixTimestamps/README.md) | Off | No | Shows Unix epoch timestamps next to chat messages. |
| [UrlDecodeMacro](../runtime/src/plugins/urlDecodeMacro/README.md) | Off | No | Turns \udec:<encoded> web links back into readable text. |
| [UrlEncodeMacro](../runtime/src/plugins/urlEncodeMacro/README.md) | Off | No | Safely encodes /urlencode <text> into web-link format before sending. |

## Nitro (11)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysAnimate](../runtime/src/plugins/alwaysAnimate/README.md) | Off | Yes | Keeps GIFs, custom emojis, and stickers animating automatically. |
| [DisableReducedMotionLock](../runtime/src/plugins/disableReducedMotionLock/README.md) | Off | Yes | Keeps animated Nitro effects moving even when Reduced Motion is on. |
| [FakeNitro](../runtime/src/plugins/fakeNitro/README.md) | On | Yes | Use animated emojis, external emojis, and stickers in any chat without Nitro. |
| [ForceNitroVisuals](../runtime/src/plugins/forceNitroVisuals/README.md) | Off | Yes | Displays Nitro badge visuals locally on your own account. |
| [HidePremiumUpsells](../runtime/src/plugins/hidePremiumUpsells/README.md) | Off | Yes | Hides Nitro upgrade prompts and popups across pickers and settings. |
| [HighlightStickersInChat](../runtime/src/plugins/highlightStickersInChat/README.md) | Off | No | Highlights messages containing stickers with a purple accent. |
| [NoGifAutoplay](../runtime/src/plugins/noGifAutoplay/README.md) | Off | No | Stops GIFs in chat from auto-playing until you tap them. |
| [SpotifyCrack](../runtime/src/plugins/spotifyCrack/README.md) | Off | No | Unlocks Spotify Listen Along and stops auto-pausing while speaking. |
| [UnlockAppIcons](../runtime/src/plugins/unlockAppIcons/README.md) | Off | No | Lets you pick custom Discord app icons without Nitro. |
| [UnlockBurstChecks](../runtime/src/plugins/unlockBurstChecks/README.md) | Off | Yes | Removes super-reaction client lockouts in the reaction picker. |
| [UnlockClientThemes](../runtime/src/plugins/unlockClientThemes/README.md) | Off | Yes | Unlocks client theme previews in Appearance settings without Nitro. |

## Voice (24)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AudioToVoiceMessage](../runtime/src/plugins/audioToVoiceMessage/README.md) | Off | No | Turns any audio file you upload into a playable Discord voice message. |
| [BlockStreamPreview](../runtime/src/plugins/blockStreamPreview/README.md) | Off | No | Stops Discord from uploading preview screenshots of your screen share. |
| [BlockVoiceChannelStatus](../runtime/src/plugins/blockVoiceChannelStatus/README.md) | Off | No | Hides custom voice channel status updates from being tracked. |
| [BlockVoiceEffects](../runtime/src/plugins/blockVoiceEffects/README.md) | Off | No | Mutes voice channel soundboard effects and incoming animations. |
| [CallAlertLogger](../runtime/src/plugins/callAlertLogger/README.md) | Off | No | Saves incoming call alerts in the Nekocord Notification Log. |
| [CallTimer](../runtime/src/plugins/callTimer/README.md) | Off | No | Shows how long your voice call lasted when you leave. |
| [DisableCallIdle](../runtime/src/plugins/disableCallIdle/README.md) | Off | No | Stops Discord from kicking you out of a voice call for being idle. |
| [FakeDeafen](../runtime/src/plugins/fakeDeafen/README.md) | Off | No | Makes you look muted and deafened in voice calls while still hearing audio. |
| [FakeMute](../runtime/src/plugins/fakeMute/README.md) | Off | No | Shows you as muted in voice calls while keeping your microphone working. |
| [KeepVoiceAlive](../runtime/src/plugins/keepVoiceAlive/README.md) | Off | No | Stops Discord from disconnecting you from quiet voice calls. |
| [SilentCallRing](../runtime/src/plugins/silentCallRing/README.md) | Off | No | Mutes incoming call ringtone sounds while still showing calls on screen. |
| [StreamerModeOnStream](../runtime/src/plugins/streamerModeOnStream/README.md) | Off | No | Turns Streamer Mode on automatically while you are screen sharing. |
| [VoiceChannelAudit](../runtime/src/plugins/voiceChannelAudit/README.md) | Off | No | Counts and records voice channel joins and leaves. |
| [VoiceDeafenOnJoin](../runtime/src/plugins/voiceDeafenOnJoin/README.md) | Off | No | Automatically deafens yourself whenever you join a voice channel. |
| [VoiceDeafenOnLeave](../runtime/src/plugins/voiceDeafenOnLeave/README.md) | Off | No | Automatically deafens yourself when you disconnect from voice. |
| [VoiceDisconnectAlert](../runtime/src/plugins/voiceDisconnectAlert/README.md) | Off | No | Alerts you if a moderator moves or disconnects you from a voice channel. |
| [VoiceJoinNotifier](../runtime/src/plugins/voiceJoinNotifier/README.md) | Off | No | Alerts you when someone joins or leaves your active voice channel. |
| [VoiceMessageDownload](../runtime/src/plugins/voiceMessageDownload/README.md) | Off | No | Adds a direct audio link on voice messages so you can save or share them easily. |
| [VoiceMessageInfo](../runtime/src/plugins/voiceMessageInfo/README.md) | Off | No | Shows the exact length and file size next to voice messages in chat. |
| [VoiceMuteOnDeafen](../runtime/src/plugins/voiceMuteOnDeafen/README.md) | Off | No | Automatically mutes your mic whenever you deafen yourself. |
| [VoiceMuteOnJoin](../runtime/src/plugins/voiceMuteOnJoin/README.md) | Off | No | Automatically mutes your microphone whenever you join a voice channel. |
| [VoiceUndeafenOnJoin](../runtime/src/plugins/voiceUndeafenOnJoin/README.md) | Off | No | Automatically turns off deafen when you join a voice channel. |
| [VoiceUnmuteOnLeave](../runtime/src/plugins/voiceUnmuteOnLeave/README.md) | Off | No | Automatically unmutes your mic when you leave a voice call. |
| [VolumeBooster](../runtime/src/plugins/volumeBooster/README.md) | Off | No | Boosts voice call participant volume up to 400%. |

## Core (1)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [NekocordBanner](../runtime/src/plugins/nekocordBanner/README.md) | On | No | Runs Nekocord startup checks and logs loaded modules. |
