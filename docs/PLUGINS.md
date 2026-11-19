# Nekocord Built-in Plugins

Nekocord ships with **401** built-in plugins (**399** user-toggleable plugins and **2** core runtime plugins). Each plugin lives in its own directory under `runtime/src/plugins/<slug>/` with `index.ts` and `README.md` metadata.

## Chat (145)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlternatingWordCase](../runtime/src/plugins/alternatingWordCase/README.md) | Off | No | Alternates consecutive words between UPPERCASE and lowercase cadence. |
| [ArrowShortcuts](../runtime/src/plugins/arrowShortcuts/README.md) | Off | No | Expands ASCII arrows (`->`, `<-`, `<->`, `=>`) into crisp Unicode arrows on send. |
| [AsciiSmileys](../runtime/src/plugins/asciiSmileys/README.md) | Off | No | Escapes ASCII emoticons like :) and :D so Discord does not auto-convert them. |
| [AutoCapitalizeFirst](../runtime/src/plugins/autoCapitalizeFirst/README.md) | Off | No | Capitalizes the first letter of outgoing plain-text sentences outside code blocks. |
| [AutoCloseCodeFences](../runtime/src/plugins/autoCloseCodeFences/README.md) | Off | No | Automatically closes unclosed triple-backtick code blocks before sending. |
| [AutoEscapeUnderscores](../runtime/src/plugins/autoEscapeUnderscores/README.md) | Off | No | Escapes `snake_case_identifiers` outside code spans so Discord stops italicizing them. |
| [AutoQuoteBlock](../runtime/src/plugins/autoQuoteBlock/README.md) | Off | No | Prefixes outgoing lines with Discord quote block (> ) Markdown. |
| [AutoReplyAway](../runtime/src/plugins/autoReplyAway/README.md) | Off | No | Automatically sends a configurable away response once per DM cooldown when messaged. |
| [AutoSubtext](../runtime/src/plugins/autoSubtext/README.md) | Off | No | Prefixes outgoing lines with Discord small muted subtext (-# ) markup. |
| [AutoWrapUrls](../runtime/src/plugins/autoWrapUrls/README.md) | Off | No | Wraps outgoing links in <...> angle brackets to suppress Discord link embeds. |
| [BlurNsfw](../runtime/src/plugins/blurNsfw/README.md) | Off | No | Automatically wraps attachments in age-restricted (NSFW) channels behind spoiler overlays. |
| [BoldMessages](../runtime/src/plugins/boldMessages/README.md) | Off | No | Automatically wraps outgoing chat text in **bold** Markdown formatting. |
| [BoldSerifText](../runtime/src/plugins/boldSerifText/README.md) | Off | No | Renders ASCII letters in mathematical bold serif Unicode glyphs. |
| [BulletListShortcut](../runtime/src/plugins/bulletListShortcut/README.md) | Off | No | Converts leading `- ` or `* ` list items into Unicode bullet points on send. |
| [CatgirlSpeak](../runtime/src/plugins/catgirlSpeak/README.md) | Off | No | Sprinkles gentle nya and mrrp catgirl flair onto non-code messages. |
| [ChatPrefixSuffix](../runtime/src/plugins/chatPrefixSuffix/README.md) | Off | No | Wraps outgoing chat messages with custom configurable prefix and suffix strings. |
| [ChecklistMacro](../runtime/src/plugins/checklistMacro/README.md) | Off | No | Converts `[ ] ` and `[x] ` prefixes into Unicode checkbox bullets on send. |
| [CircledText](../runtime/src/plugins/circledText/README.md) | Off | No | Stylizes outgoing ASCII letters into circled Unicode characters. |
| [ClapBetweenWords](../runtime/src/plugins/clapBetweenWords/README.md) | Off | No | Places clap dividers between outgoing words outside mentions and links. |
| [CoinFlipMacro](../runtime/src/plugins/coinFlipMacro/README.md) | Off | No | Expands /coin into a randomized Heads or Tails flip result before sending. |
| [CompactTimestamps](../runtime/src/plugins/compactTimestamps/README.md) | Off | No | Formats message header timestamps to concise 24-hour HH:MM values. |
| [CopyEmojiMarkdown](../runtime/src/plugins/copyEmojiMarkdown/README.md) | Off | No | Displays raw `<:name:id>` markup alongside custom emojis in chat for easy copying. |
| [CurrencySymbolsMacro](../runtime/src/plugins/currencySymbolsMacro/README.md) | Off | No | Expands `\\eur`, `\\gbp`, `\\jpy`, `\\krw`, and `\\btc` into currency symbols. |
| [CustomTimestamps](../runtime/src/plugins/customTimestamps/README.md) | Off | No | Formats chat message timestamps using configurable ISO, 24-hour, or compact presets. |
| [DdInstagramLinks](../runtime/src/plugins/ddInstagramLinks/README.md) | Off | No | Rewrites Instagram post and reel URLs to ddinstagram.com before sending. |
| [DeletedTimestampAudit](../runtime/src/plugins/deletedTimestampAudit/README.md) | Off | No | Logs deleted message IDs and channel history events in telemetry. |
| [DiceRollMacro](../runtime/src/plugins/diceRollMacro/README.md) | Off | No | Expands /roll NdM dice expressions (like /roll 2d6) into itemized rolls. |
| [DisableDefaultReplyPing](../runtime/src/plugins/disableDefaultReplyPing/README.md) | Off | No | Sets initial reply mention toggle to OFF whenever starting a new reply. |
| [DisapproveShortcut](../runtime/src/plugins/disapproveShortcut/README.md) | Off | No | Expands /lod into the classic look of disapproval. |
| [DontRoundMyTimestamps](../runtime/src/plugins/dontRoundMyTimestamps/README.md) | Off | No | Preserves exact minute and second precision on message timestamps instead of rounded phrasing. |
| [DoubleVowels](../runtime/src/plugins/doubleVowels/README.md) | Off | No | Stretches final vowels slightly inside expressive words before sending. |
| [EmptyEditDeletes](../runtime/src/plugins/emptyEditDeletes/README.md) | Off | No | Deletes a message automatically if you edit its text down to nothing. |
| [EnableDefaultReplyPing](../runtime/src/plugins/enableDefaultReplyPing/README.md) | Off | No | Forces initial reply mention toggle ON whenever replying to any user. |
| [ExpandDiscordInvites](../runtime/src/plugins/expandDiscordInvites/README.md) | Off | No | Normalizes short `discord.gg/` invite links into full `https://discord.com/invite/` URLs. |
| [ExpandImagePreviewSize](../runtime/src/plugins/expandImagePreviewSize/README.md) | Off | No | Requests full-resolution media CDN URLs inside chat image embeds and attachments. |
| [FixBlueskyLinks](../runtime/src/plugins/fixBlueskyLinks/README.md) | Off | No | Rewrites Bluesky bsky.app post links to bskx.app for rich video embeds. |
| [FixCodeblockGap](../runtime/src/plugins/fixCodeblockGap/README.md) | Off | No | Removes excessive blank lines around fenced Markdown code blocks when sending messages. |
| [FixDoublePunctuation](../runtime/src/plugins/fixDoublePunctuation/README.md) | Off | No | Removes accidental spaces before commas and periods outside code blocks. |
| [FixEmbeds](../runtime/src/plugins/fixEmbeds/README.md) | Off | No | Rewrites Twitter/X, TikTok, Instagram, Reddit, and Bluesky links to embed-friendly mirrors. |
| [FixImagesQuality](../runtime/src/plugins/fixImagesQuality/README.md) | Off | No | Rewrites Discord CDN image attachment and embed URLs to request lossless quality. |
| [FixPixivLinks](../runtime/src/plugins/fixPixivLinks/README.md) | Off | No | Rewrites pixiv.net artwork links to phixiv.net for inline illustration previews. |
| [FixThreadsLinks](../runtime/src/plugins/fixThreadsLinks/README.md) | Off | No | Rewrites Threads post links to vxthreads.net so media embeds properly in chat. |
| [FixupXLinks](../runtime/src/plugins/fixupXLinks/README.md) | Off | No | Rewrites outgoing x.com and twitter.com links to fixupx.com embeds. |
| [FractionShortcuts](../runtime/src/plugins/fractionShortcuts/README.md) | Off | No | Converts `1/2`, `1/4`, `3/4`, `1/3`, and `2/3` outside URLs into Unicode fractions. |
| [FrakturText](../runtime/src/plugins/frakturText/README.md) | Off | No | Converts ASCII letters into Gothic Fraktur Unicode glyphs before send. |
| [FullTimestamps](../runtime/src/plugins/fullTimestamps/README.md) | Off | No | Displays exact date and second-level timestamps (YYYY-MM-DD HH:MM:SS) on chat messages. |
| [Greentext](../runtime/src/plugins/greentext/README.md) | Off | No | Formats lines starting with >text into green ANSI blocks while preserving > quotes. |
| [HeadingPrefix](../runtime/src/plugins/headingPrefix/README.md) | Off | No | Adds a clean H3 (### ) header prefix to non-code outgoing lines. |
| [HideAttachments](../runtime/src/plugins/hideAttachments/README.md) | Off | No | Hides attachment previews from incoming messages while preserving text content. |
| [HideStickers](../runtime/src/plugins/hideStickers/README.md) | Off | No | Suppresses sticker renders inline inside chat message rows. |
| [HideTyping](../runtime/src/plugins/hideTyping/README.md) | Off | No | Hides typing indicators from other users by dropping incoming TYPING_START events. |
| [HighlightAttachmentRows](../runtime/src/plugins/highlightAttachmentRows/README.md) | Off | No | Adds a cool cyan gutter accent on messages with attached files or media. |
| [HighlightBotMessages](../runtime/src/plugins/highlightBotMessages/README.md) | Off | No | Marks messages sent by bots or webhooks with a subtle blurple gutter. |
| [HighlightCodeBlocks](../runtime/src/plugins/highlightCodeBlocks/README.md) | Off | No | Highlights messages containing fenced Markdown code blocks. |
| [HighlightEditedMessages](../runtime/src/plugins/highlightEditedMessages/README.md) | Off | No | Adds a mint gutter stripe to edited messages for quick scanning. |
| [HighlightEveryonePings](../runtime/src/plugins/highlightEveryonePings/README.md) | Off | No | Adds a clear amber accent highlight to messages pinging everyone. |
| [HighlightFileAttachments](../runtime/src/plugins/highlightFileAttachments/README.md) | Off | No | Shows a `[file]` badge on messages containing downloadable non-image attachments. |
| [HighlightLinks](../runtime/src/plugins/highlightLinks/README.md) | Off | No | Highlights incoming messages that contain external HTTP or HTTPS URLs. |
| [HighlightLongMessages](../runtime/src/plugins/highlightLongMessages/README.md) | Off | No | Highlights messages longer than 350 characters with a cyan gutter accent. |
| [HighlightMentionsOfMe](../runtime/src/plugins/highlightMentionsOfMe/README.md) | Off | No | Highlights chat rows that mention your account ID or username cleanly in amber. |
| [HighlightNitroGifts](../runtime/src/plugins/highlightNitroGifts/README.md) | Off | No | Highlights messages containing `discord.gift/` codes cleanly in mint green. |
| [HighlightPinnedIndicator](../runtime/src/plugins/highlightPinnedIndicator/README.md) | Off | No | Adds a `[pinned]` badge beside timestamps on pinned chat messages. |
| [HighlightQuestions](../runtime/src/plugins/highlightQuestions/README.md) | Off | No | Highlights incoming question messages ending in `?` with a cyan accent. |
| [HighlightReplies](../runtime/src/plugins/highlightReplies/README.md) | Off | No | Highlights messages that reply to another message with a subtle blurple accent. |
| [HighlightSystemMessages](../runtime/src/plugins/highlightSystemMessages/README.md) | Off | No | Highlights system event rows cleanly with a soft purple accent. |
| [HighlightVoiceMessages](../runtime/src/plugins/highlightVoiceMessages/README.md) | Off | No | Highlights voice note messages with a warm amber gutter accent. |
| [ILoveSpam](../runtime/src/plugins/iLoveSpam/README.md) | Off | No | Prevents Discord from automatically collapsing or hiding messages flagged as likely spam. |
| [ImageFilename](../runtime/src/plugins/imageFilename/README.md) | Off | No | Appends attachment filenames and sizes inline under chat messages with media. |
| [IrcColors](../runtime/src/plugins/ircColors/README.md) | Off | No | Applies deterministic IRC-style pastel colors to usernames without a custom role color. |
| [ItalicMessages](../runtime/src/plugins/italicMessages/README.md) | Off | No | Automatically wraps outgoing chat text in *italic* Markdown formatting. |
| [LeetSpeak](../runtime/src/plugins/leetSpeak/README.md) | Off | No | Turns standard letters into classic 1337 digits before sending. |
| [LennyShortcut](../runtime/src/plugins/lennyShortcut/README.md) | Off | No | Expands /lenny in outgoing chat messages. |
| [MarkdownTableMacro](../runtime/src/plugins/markdownTableMacro/README.md) | Off | No | Expands `\\table2` into a formatted 2-column Markdown comparison block. |
| [MathSymbolsShortcut](../runtime/src/plugins/mathSymbolsShortcut/README.md) | Off | No | Replaces `!=`, `<=`, `>=`, `+-`, and `~=` with Unicode math operators on send. |
| [MentionAlertHighlight](../runtime/src/plugins/mentionAlertHighlight/README.md) | Off | No | Highlights incoming messages matching custom comma-separated alert keywords. |
| [MentionLogger](../runtime/src/plugins/mentionLogger/README.md) | Off | No | Logs incoming `@everyone` and `@here` ping messages cleanly into Notification Log. |
| [MessageLatency](../runtime/src/plugins/messageLatency/README.md) | Off | No | Highlights delayed incoming messages by annotating delivery latency on chat rows. |
| [MessageLogger](../runtime/src/plugins/messageLogger/README.md) | On | Yes | Keeps deleted messages and previous edit revisions inline in chat. |
| [MessageWhitespaceCleaner](../runtime/src/plugins/messageWhitespaceCleaner/README.md) | Off | No | Trims trailing spaces on lines and collapses excessive blank lines before send. |
| [MirrorWords](../runtime/src/plugins/mirrorWords/README.md) | Off | No | Reverses word order inside outgoing text while keeping words readable. |
| [MockingText](../runtime/src/plugins/mockingText/README.md) | Off | No | Converts outgoing prose into alternating mocking case outside links and code blocks. |
| [MoreKaomoji](../runtime/src/plugins/moreKaomoji/README.md) | Off | No | Expands shortcodes such as :shrug:, :tableflip:, :lenny:, and :cat: into kaomoji on send. |
| [NoBlockedMessages](../runtime/src/plugins/noBlockedMessages/README.md) | Off | Yes | Completely hides incoming and loaded messages from blocked or ignored users. |
| [NoDiscordAutoEmoji](../runtime/src/plugins/noDiscordAutoEmoji/README.md) | Off | No | Escapes colon :shortcode: tokens with a backslash to preserve literal text. |
| [NoEditLabel](../runtime/src/plugins/noEditLabel/README.md) | Off | No | Hides the (edited) tag while preserving MessageLogger deleted markers. |
| [NoMaskedUrlPaste](../runtime/src/plugins/noMaskedUrlPaste/README.md) | Off | No | Unwraps Markdown masked `[label](url)` links into explicit bare URLs before sending. |
| [NoMassMentions](../runtime/src/plugins/noMassMentions/README.md) | Off | No | Safely disarms accidental `@everyone` and `@here` mentions on send. |
| [NoMosaic](../runtime/src/plugins/noMosaic/README.md) | Off | No | Disables Discord multi-image mosaic cropping so attachments render cleanly. |
| [NoReplyMention](../runtime/src/plugins/noReplyMention/README.md) | On | No | Automatically disables ping mentions when starting a message reply. |
| [NormalizeUsernames](../runtime/src/plugins/normalizeUsernames/README.md) | Off | No | Strips zero-width control characters and excess spacing from usernames. |
| [NoServerEmojis](../runtime/src/plugins/noServerEmojis/README.md) | Off | No | Renders custom guild emojis as plain `:name:` shortcodes in incoming chat messages. |
| [NoSuperReactions](../runtime/src/plugins/noSuperReactions/README.md) | Off | No | Flattens animated Nitro super reactions into standard message reactions. |
| [NumberedListFix](../runtime/src/plugins/numberedListFix/README.md) | Off | No | Converts `1)` style numbered list prefixes into Markdown `1. ` lists. |
| [PigLatin](../runtime/src/plugins/pigLatin/README.md) | Off | No | Converts standard English words outside code and mentions into Pig Latin. |
| [PirateSpeak](../runtime/src/plugins/pirateSpeak/README.md) | Off | No | Adds classic pirate dialect flavor to everyday words before sending. |
| [ProtectMessageDrafts](../runtime/src/plugins/protectMessageDrafts/README.md) | Off | No | Blocks unexpected DRAFT_CLEAR dispatches so unsent drafts stay intact. |
| [ReplyTimestamp](../runtime/src/plugins/replyTimestamp/README.md) | Off | No | Displays the original message timestamp alongside inline reply previews. |
| [RevealAllSpoilers](../runtime/src/plugins/revealAllSpoilers/README.md) | Off | No | Automatically reveals inline text and attachment spoilers in chat. |
| [ReverseSentences](../runtime/src/plugins/reverseSentences/README.md) | Off | No | Reverses the sequence of sentences inside multi-sentence messages. |
| [ReverseText](../runtime/src/plugins/reverseText/README.md) | Off | No | Reverses outgoing message prose while keeping links, mentions, emojis, and code intact. |
| [RussianTranslit](../runtime/src/plugins/russianTranslit/README.md) | Off | No | Substitutes lookalike Latin letters with matching Cyrillic homoglyphs. |
| [RxdditLinks](../runtime/src/plugins/rxdditLinks/README.md) | Off | No | Rewrites outgoing reddit.com links to rxddit.com for inline video and gallery cards. |
| [SendTimestamps](../runtime/src/plugins/sendTimestamps/README.md) | Off | No | Converts @HH:MM and @YYYY-MM-DD HH:MM tokens into native Discord dynamic timestamps. |
| [SentenceCaseFix](../runtime/src/plugins/sentenceCaseFix/README.md) | Off | No | Automatically capitalizes the opening letter of each sentence. |
| [ShakespeareSpeak](../runtime/src/plugins/shakespeareSpeak/README.md) | Off | No | Lightly adapts pronouns and greetings into Early Modern English phrasing. |
| [ShoutCase](../runtime/src/plugins/shoutCase/README.md) | Off | No | Converts outgoing chat words to UPPERCASE outside code and mentions. |
| [ShowAttachmentCount](../runtime/src/plugins/showAttachmentCount/README.md) | Off | No | Displays `[N files]` beside message timestamps when 2 or more attachments exist. |
| [ShowAttachmentSizes](../runtime/src/plugins/showAttachmentSizes/README.md) | Off | No | Displays total formatted attachment size (`[2.4 MB]`) next to row timestamps. |
| [ShowEditedTime](../runtime/src/plugins/showEditedTime/README.md) | Off | No | Displays the exact HH:MM edit time inline on edited chat messages. |
| [ShowEmbedCount](../runtime/src/plugins/showEmbedCount/README.md) | Off | No | Displays `[N embeds]` beside timestamps on messages carrying 2 or more embeds. |
| [ShowMessageLength](../runtime/src/plugins/showMessageLength/README.md) | Off | No | Shows character count badges next to timestamps on messages with 120+ characters. |
| [ShowMeYourName](../runtime/src/plugins/showMeYourName/README.md) | Off | No | Displays each message author @username next to their display name in chat. |
| [ShowReplyAuthorBadge](../runtime/src/plugins/showReplyAuthorBadge/README.md) | Off | No | Shows `[-> @username]` beside row timestamps when replying to a message. |
| [ShowStickerNameBadge](../runtime/src/plugins/showStickerNameBadge/README.md) | Off | No | Shows `[sticker: Name]` next to the timestamp when a message contains a sticker. |
| [ShrugShortcut](../runtime/src/plugins/shrugShortcut/README.md) | Off | No | Expands /shrug into the classic shrug emoticon automatically. |
| [SilentMessages](../runtime/src/plugins/silentMessages/README.md) | Off | No | Automatically prepends @silent to outgoing messages so recipients are not pinged. |
| [SmallCapsText](../runtime/src/plugins/smallCapsText/README.md) | Off | No | Converts lowercase text into clean Unicode small-caps letters. |
| [SpaceLetters](../runtime/src/plugins/spaceLetters/README.md) | Off | No | Inserts gentle spaces between characters of regular words for emphasis. |
| [SpoilerEveryWord](../runtime/src/plugins/spoilerEveryWord/README.md) | Off | No | Wraps every non-code word in \|\|spoiler\|\| tags individually. |
| [SpoilerMessage](../runtime/src/plugins/spoilerMessage/README.md) | Off | No | Wraps your entire outgoing message in \|\|spoiler\|\| tags automatically. |
| [SpoilerUrlsOnSend](../runtime/src/plugins/spoilerUrlsOnSend/README.md) | Off | No | Wraps outgoing HTTP/HTTPS URLs inside `\|\|...\|\|` spoiler tags before sending. |
| [SquareText](../runtime/src/plugins/squareText/README.md) | Off | No | Converts letters into enclosed squared Unicode block letters. |
| [StrikethroughMessages](../runtime/src/plugins/strikethroughMessages/README.md) | Off | No | Wraps outgoing prose in ~~strikethrough~~ Markdown tags. |
| [StripMarkdownOnSend](../runtime/src/plugins/stripMarkdownOnSend/README.md) | Off | No | Strips bold, italic, underline, strikethrough, and heading markers before sending. |
| [StutterText](../runtime/src/plugins/stutterText/README.md) | Off | No | Adds subtle initial-letter stutter phrasing to opening words. |
| [SuppressEmbedsOnSend](../runtime/src/plugins/suppressEmbedsOnSend/README.md) | Off | No | Marks outgoing messages containing URLs with the suppress-embeds flag. |
| [TableflipShortcut](../runtime/src/plugins/tableflipShortcut/README.md) | Off | No | Expands /tableflip in outgoing messages into the classic flip emoticon. |
| [TextReplace](../runtime/src/plugins/textReplace/README.md) | Off | No | Expands classic text macros (`:shrug:`, `:tableflip:`, `:unflip:`, `:lenny:`, `:tm:`) on send. |
| [TitleCaseChat](../runtime/src/plugins/titleCaseChat/README.md) | Off | No | Capitalizes the first letter of every word before sending. |
| [TrimBlankLinesOnSend](../runtime/src/plugins/trimBlankLinesOnSend/README.md) | Off | No | Strips leading and trailing blank lines on outgoing chat messages. |
| [UnderlineMessages](../runtime/src/plugins/underlineMessages/README.md) | Off | No | Automatically wraps outgoing chat text in __underline__ Markdown formatting. |
| [UnflipShortcut](../runtime/src/plugins/unflipShortcut/README.md) | Off | No | Expands /unflip into the upright table restore emoticon. |
| [Unindent](../runtime/src/plugins/unindent/README.md) | Off | No | Strips redundant common leading indentation from multi-line fenced code blocks before send. |
| [UnsuppressEmbeds](../runtime/src/plugins/unsuppressEmbeds/README.md) | Off | No | Clears client-side embed suppression flags so hidden message link previews stay visible. |
| [UnwrapAngleUrls](../runtime/src/plugins/unwrapAngleUrls/README.md) | Off | No | Removes surrounding <...> brackets from outgoing URLs so previews embed normally. |
| [UpsideDownText](../runtime/src/plugins/upsideDownText/README.md) | Off | No | Flips outgoing chat sentences upside down outside links and code blocks. |
| [UwUify](../runtime/src/plugins/uwuify/README.md) | Off | No | Transforms outgoing chat prose while keeping links, mentions, emojis, and code blocks intact. |
| [ValidReply](../runtime/src/plugins/validReply/README.md) | Off | No | Labels replies whose referenced message target is unavailable or deleted. |
| [ValidUser](../runtime/src/plugins/validUser/README.md) | Off | No | Resolves raw `@user` mention placeholders inline using cached UserStore usernames. |
| [VaporwaveText](../runtime/src/plugins/vaporwaveText/README.md) | Off | No | Converts outgoing ASCII characters into aesthetic fullwidth characters. |
| [VxTikTokLinks](../runtime/src/plugins/vxTikTokLinks/README.md) | Off | No | Rewrites outgoing tiktok.com links to vxtiktok.com for reliable video previews. |
| [VxTwitterLinks](../runtime/src/plugins/vxTwitterLinks/README.md) | Off | No | Rewrites outgoing x.com and twitter.com links to vxtwitter.com embeds. |
| [WhisperCase](../runtime/src/plugins/whisperCase/README.md) | Off | No | Converts outgoing chat words to lowercase outside code and mentions. |
| [WordCounter](../runtime/src/plugins/wordCounter/README.md) | Off | No | Displays a word count badge on long messages or appends word counts on send. |
| [ZalgoLite](../runtime/src/plugins/zalgoLite/README.md) | Off | No | Adds light glitch diacritics to regular words outside links and code. |

## UI (74)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysExpandRoles](../runtime/src/plugins/alwaysExpandRoles/README.md) | Off | No | Expands all member role chips on user profiles without requiring "+N" taps. |
| [AutoClearCustomStatus](../runtime/src/plugins/autoClearCustomStatus/README.md) | Off | No | Clears stale custom status text whenever enabled on startup. |
| [BetterRoleDot](../runtime/src/plugins/betterRoleDot/README.md) | Off | No | Forces role color dots and username role colors to show on chat messages. |
| [ColorSighted](../runtime/src/plugins/colorSighted/README.md) | Off | No | Restores clean circular status dots instead of accessibility geometric shape overlays. |
| [CompactBotMessages](../runtime/src/plugins/compactBotMessages/README.md) | Off | No | Collapses extra blank lines inside verbose bot message payloads. |
| [CompactReactionRow](../runtime/src/plugins/compactReactionRow/README.md) | Off | No | Caps visible reaction chips per message at six to stop reaction walls. |
| [CustomEmbedColorAccent](../runtime/src/plugins/customEmbedColorAccent/README.md) | Off | No | Highlights pinned or bot-authored chat rows with configurable colored gutter accents. |
| [CustomRPC](../runtime/src/plugins/customRPC/README.md) | Off | No | Displays configurable custom Rich Presence (Playing, Streaming, Listening, Watching, Competing) on your Discord profile. |
| [DefaultUserAvatars](../runtime/src/plugins/defaultUserAvatars/README.md) | Off | No | Replaces custom user avatars with Discord monochrome default icons in chat. |
| [DimBotAttachments](../runtime/src/plugins/dimBotAttachments/README.md) | Off | No | Lowers media opacity slightly on automated bot and webhook attachments. |
| [DisableUploadPreview](../runtime/src/plugins/disableUploadPreview/README.md) | Off | No | Disables expanded attachment upload card previews in chat rows. |
| [ForceOwnerCrown](../runtime/src/plugins/forceOwnerCrown/README.md) | Off | No | Marks guild owners clearly in chat rows even in servers that hide the owner crown. |
| [GreetStickerPicker](../runtime/src/plugins/greetStickerPicker/README.md) | Off | No | Hides the persistent "Wave to say hi!" welcome sticker button in empty DMs and channels. |
| [HideActivityInvites](../runtime/src/plugins/hideActivityInvites/README.md) | Off | No | Hides Rich Presence game and Spotify party invite cards in chat. |
| [HideAppsButton](../runtime/src/plugins/hideAppsButton/README.md) | Off | Yes | Hides the Apps and Commands launcher button from the chat composer. |
| [HideBlockedReplies](../runtime/src/plugins/hideBlockedReplies/README.md) | Off | No | Clears inline reply preview banners when replying to blocked message placeholders. |
| [HideBlockedTyping](../runtime/src/plugins/hideBlockedTyping/README.md) | Off | No | Drops incoming typing indicators from blocked or ignored users. |
| [HideBoostMessages](../runtime/src/plugins/hideBoostMessages/README.md) | Off | No | Suppresses incoming server boost announcement system messages in chat. |
| [HideBotCommandsHeader](../runtime/src/plugins/hideBotCommandsHeader/README.md) | Off | No | Hides slash-command usage headers above bot response messages. |
| [HideCallBanners](../runtime/src/plugins/hideCallBanners/README.md) | Off | No | Hides missed/started voice call metadata banners inside DM message rows. |
| [HideChannelNotices](../runtime/src/plugins/hideChannelNotices/README.md) | Off | No | Dismisses noisy channel notice and dismissible server prompt banners. |
| [HideChannelPrompts](../runtime/src/plugins/hideChannelPrompts/README.md) | Off | No | Suppresses wave-to-say-hi and conversation starter prompt cards. |
| [HideEmbedAuthors](../runtime/src/plugins/hideEmbedAuthors/README.md) | Off | No | Removes redundant author headers and footer lines inside chat embeds. |
| [HideEmbedFields](../runtime/src/plugins/hideEmbedFields/README.md) | Off | No | Removes multi-row embed fields from rendered bot cards. |
| [HideEmbedFooters](../runtime/src/plugins/hideEmbedFooters/README.md) | Off | No | Removes verbose footer text lines from rendered rich embeds. |
| [HideEmbeds](../runtime/src/plugins/hideEmbeds/README.md) | Off | No | Hides all link and rich embed cards rendered beneath messages. |
| [HideEmptyEmbeds](../runtime/src/plugins/hideEmptyEmbeds/README.md) | Off | No | Filters blank placeholder embeds from chat message rows. |
| [HideForwardHeaders](../runtime/src/plugins/hideForwardHeaders/README.md) | Off | No | Removes the Forwarded message source header above forwarded content. |
| [HideGiftButton](../runtime/src/plugins/hideGiftButton/README.md) | Off | Yes | Hides the Nitro gift button from the chat message composer. |
| [HideGiftIntents](../runtime/src/plugins/hideGiftIntents/README.md) | Off | No | Removes birthday and Nitro gift prompt banners inside message rows. |
| [HideInviteCards](../runtime/src/plugins/hideInviteCards/README.md) | Off | No | Clears Discord server invite rich cards from rendered message embeds. |
| [HideJoinMessages](../runtime/src/plugins/hideJoinMessages/README.md) | Off | No | Suppresses incoming server welcome/join system messages (type 7) in chat. |
| [HideMediaAttachments](../runtime/src/plugins/hideMediaAttachments/README.md) | Off | No | Hides inline file and media attachment boxes from the chat timeline. |
| [HideMessageComponents](../runtime/src/plugins/hideMessageComponents/README.md) | Off | No | Hides interactive bot button and select-menu component rows beneath messages. |
| [HidePinnedNotices](../runtime/src/plugins/hidePinnedNotices/README.md) | Off | No | Suppresses live "pinned a message to this channel" system notifications in chat. |
| [HidePolls](../runtime/src/plugins/hidePolls/README.md) | Off | No | Hides interactive poll cards from the chat timeline. |
| [HidePollVoteCounts](../runtime/src/plugins/hidePollVoteCounts/README.md) | Off | No | Hides live poll vote counts inside chat rows so results do not bias reading. |
| [HidePostPreviews](../runtime/src/plugins/hidePostPreviews/README.md) | Off | No | Removes forum post preview embeds inside message rows. |
| [HidePronouns](../runtime/src/plugins/hidePronouns/README.md) | Off | Yes | Clears pronoun labels on opened user and member profiles. |
| [HideReactions](../runtime/src/plugins/hideReactions/README.md) | Off | No | Hides all reaction chip rows underneath chat messages. |
| [HideServerTagBadges](../runtime/src/plugins/hideServerTagBadges/README.md) | Off | No | Removes server identity tag pills next to author usernames in chat rows. |
| [HideStickerLabels](../runtime/src/plugins/hideStickerLabels/README.md) | Off | No | Strips alt-text description labels attached to chat stickers. |
| [HideThreadCards](../runtime/src/plugins/hideThreadCards/README.md) | Off | No | Removes inline thread embed summary cards from channel chat. |
| [HideThreadCreatedRows](../runtime/src/plugins/hideThreadCreatedRows/README.md) | Off | No | Suppresses incoming "User started a thread" system rows in chat. |
| [HideUserBanners](../runtime/src/plugins/hideUserBanners/README.md) | Off | Yes | Strips custom Nitro profile banners to preserve clean profile headers. |
| [HideUserBios](../runtime/src/plugins/hideUserBios/README.md) | Off | Yes | Hides custom About Me bios on opened Discord profile sheets. |
| [HideVoiceChannelBadges](../runtime/src/plugins/hideVoiceChannelBadges/README.md) | Off | No | Hides In Voice badges next to message authors currently in voice. |
| [HideWebhookBadges](../runtime/src/plugins/hideWebhookBadges/README.md) | Off | No | Removes `APP` / `BOT` pill tags beside webhook message usernames. |
| [LoadingQuotes](../runtime/src/plugins/loadingQuotes/README.md) | Off | No | Replaces Discord splash loading hints with cozy Nekocord quips. |
| [MemberCount](../runtime/src/plugins/memberCount/README.md) | Off | No | Tracks live online and total guild member counts across server list updates. |
| [NekocordSettingsUI](../runtime/src/plugins/nekocordSettingsUI/README.md) | On | No | Integrates Nekocord, Plugins, Themes, Updater, and Backup & Restore directly into Discord User Settings. |
| [NoAvatarDecorations](../runtime/src/plugins/noAvatarDecorations/README.md) | Off | No | Hides Nitro avatar decorations on messages and user profiles. |
| [NoBotBadges](../runtime/src/plugins/noBotBadges/README.md) | Off | No | Hides BOT, APP, and webhook tag pills next to author names. |
| [NoClanTags](../runtime/src/plugins/noClanTags/README.md) | Off | No | Hides server clan tags and badges displayed beside usernames in chat. |
| [NoConnectionsRoleTag](../runtime/src/plugins/noConnectionsRoleTag/README.md) | Off | No | Hides linked connections role pills shown next to chat authors. |
| [NoEmbedThumbnails](../runtime/src/plugins/noEmbedThumbnails/README.md) | Off | No | Strips thumbnails, preview images, and video frames from link embeds. |
| [NoInlineForwardButton](../runtime/src/plugins/noInlineForwardButton/README.md) | Off | No | Hides inline quick-forward buttons rendered next to chat media and messages. |
| [NoLinkDecorations](../runtime/src/plugins/noLinkDecorations/README.md) | Off | No | Removes extra decorative icons next to links in chat messages. |
| [NoOnboardingDelay](../runtime/src/plugins/noOnboardingDelay/README.md) | Off | No | Removes artificial prompt countdown delays during server onboarding screens. |
| [NoOpTag](../runtime/src/plugins/noOpTag/README.md) | Off | No | Hides Original Poster (OP) badges inside forum and text threads. |
| [NoPendingCount](../runtime/src/plugins/noPendingCount/README.md) | Off | Yes | Clears pending friend request and message request count badges. |
| [NoProfileEffects](../runtime/src/plugins/noProfileEffects/README.md) | Off | Yes | Strips animated Nitro profile effects from user profile cards. |
| [NoProfileThemes](../runtime/src/plugins/noProfileThemes/README.md) | Off | Yes | Strips custom Nitro profile theme colors so user profiles use your base Discord theme. |
| [NoRoleColors](../runtime/src/plugins/noRoleColors/README.md) | Off | No | Removes custom role username colours for a uniform neutral feed. |
| [NoRoleGradient](../runtime/src/plugins/noRoleGradient/README.md) | Off | No | Flattens multi-stop role name gradients down to the primary solid role color. |
| [NoRoleIcons](../runtime/src/plugins/noRoleIcons/README.md) | Off | No | Hides custom role icons beside author names in chat. |
| [NoStickerAutoSuggest](../runtime/src/plugins/noStickerAutoSuggest/README.md) | Off | No | Disables automatic sticker suggestion popups while typing emojis or words. |
| [NoTypingAnimation](../runtime/src/plugins/noTypingAnimation/README.md) | Off | No | Disables animated bouncing typing dots to reduce UI motion and battery usage. |
| [NoUnblockToJump](../runtime/src/plugins/noUnblockToJump/README.md) | Off | No | Skips the "Unblock user to jump" confirmation prompt when tapping replies from blocked users. |
| [OnlyMyReactions](../runtime/src/plugins/onlyMyReactions/README.md) | Off | No | Shows only reactions that you have reacted with in chat rows. |
| [PlainFolderIcon](../runtime/src/plugins/plainFolderIcon/README.md) | Off | No | Replaces crowded server folder mini-icon previews with clean uniform folder icons. |
| [RoleColorEverywhere](../runtime/src/plugins/roleColorEverywhere/README.md) | Off | No | Resolves and applies a member highest colored role to usernames when missing in chat rows. |
| [ShowFullSnowflakeDate](../runtime/src/plugins/showFullSnowflakeDate/README.md) | Off | No | Appends the decoded `(YYYY-MM-DD)` date beside short timestamps. |
| [ShowTimeoutDuration](../runtime/src/plugins/showTimeoutDuration/README.md) | Off | No | Displays remaining communication timeout duration beside timed-out members in chat. |

## Privacy (73)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AnonymiseFileNames](../runtime/src/plugins/anonymiseFileNames/README.md) | Off | No | Randomizes uploaded attachment filenames to 8-character hex names. |
| [AnonymiseLinks](../runtime/src/plugins/anonymiseLinks/README.md) | Off | No | Strips URL query parameters and optionally prepends a privacy redirect prefix on send. |
| [AutoSpoilerAttachments](../runtime/src/plugins/autoSpoilerAttachments/README.md) | Off | No | Automatically marks outgoing uploaded files as spoilers based on configurable media types. |
| [BlockActivityStatus](../runtime/src/plugins/blockActivityStatus/README.md) | Off | No | Prevents local game and app activity updates from being broadcast. |
| [BlockCallTelemetry](../runtime/src/plugins/blockCallTelemetry/README.md) | Off | No | Suppresses outgoing voice quality metrics and media connection stats dispatches. |
| [BlockCrashReports](../runtime/src/plugins/blockCrashReports/README.md) | Off | No | Drops client crash telemetry and Sentry dispatch payloads locally. |
| [BlockExperimentExposures](../runtime/src/plugins/blockExperimentExposures/README.md) | Off | No | Drops Discord experiment exposure tracking Flux events. |
| [BlockTypingDispatch](../runtime/src/plugins/blockTypingDispatch/README.md) | Off | No | Blocks local TYPING_START_LOCAL and channel typing broadcast actions. |
| [CleanAliExpressLinks](../runtime/src/plugins/cleanAliExpressLinks/README.md) | Off | No | Strips tracking query junk from outgoing AliExpress item links. |
| [CleanAmazonLinks](../runtime/src/plugins/cleanAmazonLinks/README.md) | Off | No | Strips tracking slugs and referral queries down to canonical Amazon /dp/ASIN links. |
| [CleanAppleMusicLinks](../runtime/src/plugins/cleanAppleMusicLinks/README.md) | Off | No | Removes `ls=1`, `itsct`, and `itscg` tracking params from Apple Music URLs. |
| [CleanBilibiliLinks](../runtime/src/plugins/cleanBilibiliLinks/README.md) | Off | No | Strips tracking query parameters from Bilibili URLs before sending. |
| [CleanFacebookLinks](../runtime/src/plugins/cleanFacebookLinks/README.md) | Off | No | Strips `fbclid` and `mibextid` tracking query parameters from outgoing URLs. |
| [CleanFigmaLinks](../runtime/src/plugins/cleanFigmaLinks/README.md) | Off | No | Removes transient `&t=` tokens from Figma file URLs while keeping `node-id`. |
| [CleanGoogleDocsLinks](../runtime/src/plugins/cleanGoogleDocsLinks/README.md) | Off | No | Strips `?usp=sharing` and Drive share-source noise from Google Docs/Drive URLs. |
| [CleanInstagramShare](../runtime/src/plugins/cleanInstagramShare/README.md) | Off | No | Strips igsh and tracking parameters from outgoing Instagram URLs. |
| [CleanLinkedinLinks](../runtime/src/plugins/cleanLinkedinLinks/README.md) | Off | No | Strips `trk`, `lipi`, `refId`, and `trackingId` params from LinkedIn links. |
| [CleanMediumLinks](../runtime/src/plugins/cleanMediumLinks/README.md) | Off | No | Removes `source=` referral parameters from Medium article links. |
| [CleanNotionLinks](../runtime/src/plugins/cleanNotionLinks/README.md) | Off | No | Removes `?pvs=` session tracking parameters from Notion page URLs. |
| [CleanPinterestLinks](../runtime/src/plugins/cleanPinterestLinks/README.md) | Off | No | Strips invite code and sender tracking query strings from Pinterest URLs. |
| [CleanRedditShareLinks](../runtime/src/plugins/cleanRedditShareLinks/README.md) | Off | No | Removes `share_id`, `utm_*`, and `ref` query params from Reddit URLs. |
| [CleanShopeeLinks](../runtime/src/plugins/cleanShopeeLinks/README.md) | Off | No | Removes tracking query strings from Shopee product share links. |
| [CleanSoundCloudLinks](../runtime/src/plugins/cleanSoundCloudLinks/README.md) | Off | No | Removes `si=` and `utm_*` tracking parameters from SoundCloud links. |
| [CleanSpotifyLinks](../runtime/src/plugins/cleanSpotifyLinks/README.md) | Off | No | Removes ?si= and share-tracking parameters from outgoing Spotify links. |
| [CleanSubstackLinks](../runtime/src/plugins/cleanSubstackLinks/README.md) | Off | No | Removes Substack share and publication tracking parameters on send. |
| [CleanThreadsParams](../runtime/src/plugins/cleanThreadsParams/README.md) | Off | No | Strips `?xmt=` and `igshid=` tracking params from Threads URLs. |
| [CleanTiktokLinks](../runtime/src/plugins/cleanTiktokLinks/README.md) | Off | No | Removes share tracking query strings from TikTok URLs before sending. |
| [CleanTokopediaLinks](../runtime/src/plugins/cleanTokopediaLinks/README.md) | Off | No | Removes `extParam` and tracking query strings from Tokopedia product URLs. |
| [CleanTwitchLinks](../runtime/src/plugins/cleanTwitchLinks/README.md) | Off | No | Strips Twitch referral query parameters (`tt_content`, `tt_medium`) from URLs. |
| [CleanTwitterParams](../runtime/src/plugins/cleanTwitterParams/README.md) | Off | No | Strips `s=` and `t=` share tracking parameters from X/Twitter links on send. |
| [CleanYoutubeTracking](../runtime/src/plugins/cleanYoutubeTracking/README.md) | Off | No | Removes `si`, `pp`, and `feature` tracking parameters from YouTube share links. |
| [CleanZeroWidthSend](../runtime/src/plugins/cleanZeroWidthSend/README.md) | Off | No | Strips invisible zero-width joiners and BOM bytes from outgoing messages. |
| [ClearURLs](../runtime/src/plugins/clearUrls/README.md) | On | No | Strips tracking query parameters such as utm_*, fbclid, igsh, and si from outgoing links. |
| [CustomIdle](../runtime/src/plugins/customIdle/README.md) | Off | No | Prevents Discord from automatically flipping your online status to Idle due to inactivity. |
| [FlagSuspiciousDownloads](../runtime/src/plugins/flagSuspiciousDownloads/README.md) | Off | No | Prepends a warning badge to messages carrying flagged or suspicious files. |
| [ForceHttpsLinks](../runtime/src/plugins/forceHttpsLinks/README.md) | Off | No | Upgrades outgoing insecure http:// web links to https:// automatically. |
| [FriendRemovedAudit](../runtime/src/plugins/friendRemovedAudit/README.md) | Off | No | Tracks friend and relationship removal events via Flux telemetry. |
| [GuildLeaveAudit](../runtime/src/plugins/guildLeaveAudit/README.md) | Off | No | Tracks guild kick/leave dispatches so unexpected removals are visible. |
| [HideSafetyNotices](../runtime/src/plugins/hideSafetyNotices/README.md) | Off | No | Hides Discord safety system alert banners inserted into chat rows. |
| [HideTypingInDMs](../runtime/src/plugins/hideTypingInDMs/README.md) | Off | No | Blocks outgoing typing indicator events specifically inside DM channels. |
| [IgnoreActivities](../runtime/src/plugins/ignoreActivities/README.md) | Off | No | Blocks local activity, running game, and rich presence broadcasts from leaving your device. |
| [ImplicitRelationships](../runtime/src/plugins/implicitRelationships/README.md) | Off | No | Tracks recent DM and voice interaction peers locally for quick implicit friend discovery. |
| [InvidiousLinks](../runtime/src/plugins/invidiousLinks/README.md) | Off | No | Rewrites YouTube watch links to the privacy-friendly yewtu.be Invidious instance. |
| [KeywordBlocker](../runtime/src/plugins/keywordBlocker/README.md) | Off | No | Masks incoming chat messages containing any word from a configurable blocklist. |
| [LibredditLinks](../runtime/src/plugins/libredditLinks/README.md) | Off | No | Routes outgoing Reddit links through a lightweight Redlib privacy frontend. |
| [MuteNewGuild](../runtime/src/plugins/muteNewGuild/README.md) | Off | No | Automatically mutes notifications and @everyone/@here pings when joining new servers. |
| [MutualGroupDMs](../runtime/src/plugins/mutualGroupDMs/README.md) | Off | No | Indexes shared group DM channels per user from local ChannelStore state. |
| [NitterLinks](../runtime/src/plugins/nitterLinks/README.md) | Off | No | Rewrites Twitter and X links to an anonymous Nitter mirror before sending. |
| [NoAnalyticsBeacons](../runtime/src/plugins/noAnalyticsBeacons/README.md) | Off | Yes | Drops internal Discord impression, exposure, and heartbeat metric beacons. |
| [NoDevtoolsWarning](../runtime/src/plugins/noDevtoolsWarning/README.md) | Off | No | Suppresses Discord Hold Up / self-XSS developer console warning banners. |
| [NoGiftSuggestions](../runtime/src/plugins/noGiftSuggestions/README.md) | Off | No | Hides proactive Nitro gift button and upsell prompts. |
| [NoPresenceTelemetry](../runtime/src/plugins/noPresenceTelemetry/README.md) | Off | No | Drops rich presence tracking and activity launch metric actions. |
| [NoTrack](../runtime/src/plugins/noTrack/README.md) | On | No | Drops Discord analytics and telemetry Flux dispatches before they are recorded. |
| [OnePingPerDM](../runtime/src/plugins/onePingPerDM/README.md) | Off | No | Suppresses repeated push/sound ping notifications from the same DM channel within 10 seconds. |
| [PauseInvitesForever](../runtime/src/plugins/pauseInvitesForever/README.md) | Off | No | Extends server invite pause actions beyond default temporary timeouts. |
| [RedactApiKeys](../runtime/src/plugins/redactApiKeys/README.md) | Off | No | Redacts common API keys (`sk-...`, `ghp_...`, `AIza...`, `xoxb-...`) on send. |
| [RedactAwsKeys](../runtime/src/plugins/redactAwsKeys/README.md) | Off | No | Redacts AWS access key IDs (`AKIA...`, `ASIA...`) before sending. |
| [RedactBearerTokens](../runtime/src/plugins/redactBearerTokens/README.md) | Off | No | Masks `Bearer <token>` authorization credentials before sending. |
| [RedactCreditCards](../runtime/src/plugins/redactCreditCards/README.md) | Off | No | Masks 13 to 19 digit payment card number sequences before sending. |
| [RedactDiscordTokens](../runtime/src/plugins/redactDiscordTokens/README.md) | Off | No | Redacts accidental Discord authentication tokens before sending messages. |
| [RedactEmails](../runtime/src/plugins/redactEmails/README.md) | Off | No | Automatically redacts email addresses before outgoing messages are sent. |
| [RedactEnvSecrets](../runtime/src/plugins/redactEnvSecrets/README.md) | Off | No | Redacts pasted `.env` secret values (`API_KEY=`, `SECRET_KEY=`, `PASSWORD=`). |
| [RedactIpv4Addresses](../runtime/src/plugins/redactIpv4Addresses/README.md) | Off | No | Masks public IPv4 addresses in outgoing chat text to prevent accidental leaks. |
| [RedactJwtTokens](../runtime/src/plugins/redactJwtTokens/README.md) | Off | No | Intercepts and redacts leaked JWTs or token-like strings before upload. |
| [RedactPhoneNumbers](../runtime/src/plugins/redactPhoneNumbers/README.md) | Off | No | Masks accidental international or local phone numbers in outgoing chat. |
| [RedactPrivateKeys](../runtime/src/plugins/redactPrivateKeys/README.md) | Off | No | Redacts accidental PEM private key blocks before sending chat messages. |
| [SilentChannelSelect](../runtime/src/plugins/silentChannelSelect/README.md) | Off | No | Drops client channel navigation and thread view metric dispatches. |
| [SilentTyping](../runtime/src/plugins/silentTyping/README.md) | Off | No | Prevents Discord from broadcasting your typing indicator to channels. |
| [SortFriendRequests](../runtime/src/plugins/sortFriendRequests/README.md) | Off | No | Sorts incoming and outgoing pending friend requests newest-first by arrival order. |
| [StripExifFileNames](../runtime/src/plugins/stripExifFileNames/README.md) | Off | No | Replaces camera date-stamped filenames (`IMG_`, `PXL_`, `DSC_`) with neutral names. |
| [StripReferralUpsells](../runtime/src/plugins/stripReferralUpsells/README.md) | Off | No | Blocks Nitro referral upsell modal dispatches and marketing impressions. |
| [SuppressReadReceipts](../runtime/src/plugins/suppressReadReceipts/README.md) | Off | Yes | Blocks outgoing channel read receipt acknowledgements when browsing. |
| [YoutubeNoCookie](../runtime/src/plugins/youtubeNoCookie/README.md) | Off | No | Converts YouTube watch links into youtube-nocookie.com privacy embed URLs. |

## Utility (50)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysTrust](../runtime/src/plugins/alwaysTrust/README.md) | Off | Yes | Automatically trusts external links and skips untrusted domain warning prompts. |
| [AmpLinkCleaner](../runtime/src/plugins/ampLinkCleaner/README.md) | Off | No | Strips trailing `/amp` segments and `?amp=1` flags from shared article URLs. |
| [AutoPeriod](../runtime/src/plugins/autoPeriod/README.md) | Off | No | Appends a period when an outgoing sentence ends with an alphanumeric character. |
| [BetterSteamLinks](../runtime/src/plugins/betterSteamLinks/README.md) | Off | No | Cleans storefront referral parameters (`?snr=`) from Steam store URLs. |
| [BreezeWikiLinks](../runtime/src/plugins/breezeWikiLinks/README.md) | Off | No | Rewrites ad-heavy fandom.com wiki links to clean breezewiki.com reader URLs. |
| [CleanDuckDuckGoLinks](../runtime/src/plugins/cleanDuckDuckGoLinks/README.md) | Off | No | Unwraps `duckduckgo.com/l/?uddg=...` outbound redirect wrappers directly to target URLs. |
| [CleanEbayLinks](../runtime/src/plugins/cleanEbayLinks/README.md) | Off | No | Shortens eBay item URLs to canonical `/itm/<id>` links without tracking parameters. |
| [CleanGoogleSearchLinks](../runtime/src/plugins/cleanGoogleSearchLinks/README.md) | Off | No | Unwraps `google.com/url?q=...` redirect links directly to the target URL. |
| [CollapseSpaces](../runtime/src/plugins/collapseSpaces/README.md) | Off | No | Collapses multiple consecutive spaces inside sentences into single spaces. |
| [CountdownTimestampMacro](../runtime/src/plugins/countdownTimestampMacro/README.md) | Off | No | Expands `\\in10m`, `\\in2h`, or `\\in3d` into live Discord countdown tags `<t:UNIX:R>`. |
| [DesktopWikipediaLinks](../runtime/src/plugins/desktopWikipediaLinks/README.md) | Off | No | Converts mobile en.m.wikipedia.org links into standard desktop Wikipedia URLs. |
| [DiscordDateMacro](../runtime/src/plugins/discordDateMacro/README.md) | Off | No | Expands `\\today` into current `<t:UNIX:D>` localized Discord date tag. |
| [ExpandShortYoutuBe](../runtime/src/plugins/expandShortYoutuBe/README.md) | Off | No | Expands youtu.be shortlinks to full youtube.com/watch?v= URLs. |
| [FixBilibiliEmbeds](../runtime/src/plugins/fixBilibiliEmbeds/README.md) | Off | No | Rewrites `bilibili.com` links to `vxbilibili.com` for inline video previews. |
| [FriendRequestLogger](../runtime/src/plugins/friendRequestLogger/README.md) | Off | No | Records incoming and accepted friend requests into the Notification Log with toasts. |
| [FullTimestampMacro](../runtime/src/plugins/fullTimestampMacro/README.md) | Off | No | Expands `\\fulltime` into current `<t:UNIX:F>` localized Discord timestamp. |
| [FxEmbedsBluesky](../runtime/src/plugins/fxEmbedsBluesky/README.md) | Off | No | Rewrites `bsky.app` links to `fxbsky.app` for enhanced rich post embeds. |
| [GiphyCleanLinks](../runtime/src/plugins/giphyCleanLinks/README.md) | Off | No | Strips `cid` and `ep` tracking query parameters from Giphy GIF share URLs. |
| [GuildJoinLogger](../runtime/src/plugins/guildJoinLogger/README.md) | Off | No | Records newly joined Discord servers into the Nekocord Notification Log. |
| [ImdbCleanLinks](../runtime/src/plugins/imdbCleanLinks/README.md) | Off | No | Strips `?ref_=` query tracking noise from IMDb title and name URLs. |
| [ImgurDirectCleanLinks](../runtime/src/plugins/imgurDirectCleanLinks/README.md) | Off | No | Strips query noise from Imgur album and image URLs on send. |
| [IsoDateMacro](../runtime/src/plugins/isoDateMacro/README.md) | Off | No | Replaces /today with today's ISO YYYY-MM-DD date stamp. |
| [KeepCurrentChannel](../runtime/src/plugins/keepCurrentChannel/README.md) | Off | No | Remembers your last opened guild and DM channels across navigation switches. |
| [KickCleanLinks](../runtime/src/plugins/kickCleanLinks/README.md) | Off | No | Strips tracking query strings from outgoing Kick stream and clip links. |
| [MobileTwitterToX](../runtime/src/plugins/mobileTwitterToX/README.md) | Off | No | Converts `mobile.twitter.com` links to canonical `x.com` URLs on send. |
| [MobileWikipediaToDesktop](../runtime/src/plugins/mobileWikipediaToDesktop/README.md) | Off | No | Converts `.m.wikipedia.org` mobile URLs into standard Wikipedia links. |
| [MorseCodeMacro](../runtime/src/plugins/morseCodeMacro/README.md) | Off | No | Translates /morse <text> into International Morse dots and dashes. |
| [NSFWGateBypass](../runtime/src/plugins/nsfwGateBypass/README.md) | Off | Yes | Bypasses client-side NSFW channel and age-gate prompts. |
| [OldRedditLinks](../runtime/src/plugins/oldRedditLinks/README.md) | Off | No | Converts outgoing reddit.com links to classic old.reddit.com. |
| [OverrideForumDefaults](../runtime/src/plugins/overrideForumDefaults/README.md) | Off | No | Sets forum channels to sort threads by Latest Activity by default. |
| [PermissionFreeWill](../runtime/src/plugins/permissionFreeWill/README.md) | Off | No | Bypasses client-side UI lockouts when inspecting guild channel and member permission settings. |
| [PresenceLogger](../runtime/src/plugins/presenceLogger/README.md) | Off | No | Records friend online/idle/dnd/offline presence transitions to Notification Log. |
| [QuickMathEval](../runtime/src/plugins/quickMathEval/README.md) | Off | No | Evaluates /calc <expr> inline arithmetic cleanly using a safe math parser. |
| [QuickSnippetMacros](../runtime/src/plugins/quickSnippetMacros/README.md) | Off | No | Expands `\s1` and `\s2` triggers into configurable reusable text snippets on send. |
| [RandomPasswordMacro](../runtime/src/plugins/randomPasswordMacro/README.md) | Off | No | Expands `\\pass` macros into a 16-character random passphrase wrapped in spoiler tags. |
| [RelationshipNotifier](../runtime/src/plugins/relationshipNotifier/README.md) | Off | No | Tracks friend removals, server kicks/bans, and group DM removals in real time. |
| [ReplaceGoogleSearch](../runtime/src/plugins/replaceGoogleSearch/README.md) | Off | No | Rewrites outgoing Google Search URLs to privacy-friendly DuckDuckGo links. |
| [Rot13Macro](../runtime/src/plugins/rot13Macro/README.md) | Off | No | Transforms /rot13 <text> payloads using classic ROT13 letter rotation. |
| [ShowAttachmentAltText](../runtime/src/plugins/showAttachmentAltText/README.md) | Off | No | Displays image alt-text descriptions inline beneath message text. |
| [ShowHiddenChannels](../runtime/src/plugins/showHiddenChannels/README.md) | Off | No | Reveals locked guild channels and categories in the server sidebar (read-only metadata). |
| [ShowHiddenThings](../runtime/src/plugins/showHiddenThings/README.md) | Off | No | Exposes hidden client debug sections, badges, and internal settings predicates. |
| [SmartDashes](../runtime/src/plugins/smartDashes/README.md) | Off | No | Converts double hyphens (-- ) and ellipses (...) into clean Unicode dashes. |
| [SmartQuotes](../runtime/src/plugins/smartQuotes/README.md) | Off | No | Replaces plain ASCII quotes with balanced typographic curly quotes. |
| [StripYoutubeShorts](../runtime/src/plugins/stripYoutubeShorts/README.md) | Off | No | Converts YouTube Shorts URLs to standard watch?v= links before sending. |
| [TempConvertMacro](../runtime/src/plugins/tempConvertMacro/README.md) | Off | No | Expands `\\25C` or `\\77F` temperature macros into both Celsius and Fahrenheit. |
| [TenorCleanLinks](../runtime/src/plugins/tenorCleanLinks/README.md) | Off | No | Strips trailing share query parameters from Tenor GIF links. |
| [TrimTrailingSpaces](../runtime/src/plugins/trimTrailingSpaces/README.md) | Off | No | Trims leading/trailing whitespace and collapses excessive empty newlines. |
| [UuidGeneratorMacro](../runtime/src/plugins/uuidGeneratorMacro/README.md) | Off | No | Expands `\\uuid` macros into generated UUID v4 identifiers on send. |
| [WikiwandToWikipedia](../runtime/src/plugins/wikiwandToWikipedia/README.md) | Off | No | Converts `wikiwand.com` article URLs into canonical Wikipedia links. |
| [WordCountMacro](../runtime/src/plugins/wordCountMacro/README.md) | Off | No | Replaces trailing `\\wc` macro with `[N words]` computed from your message. |

## Developer (30)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AutoCodeBlock](../runtime/src/plugins/autoCodeBlock/README.md) | Off | No | Wraps multi-line stack traces and JSON blocks automatically inside code fences. |
| [Base64DecodeMacro](../runtime/src/plugins/base64DecodeMacro/README.md) | Off | No | Decodes /unb64 <base64> text inline before sending. |
| [Base64EncodeMacro](../runtime/src/plugins/base64EncodeMacro/README.md) | Off | No | Encodes /b64 <text> messages cleanly as UTF-8 Base64 before sending. |
| [BinaryEncodeMacro](../runtime/src/plugins/binaryEncodeMacro/README.md) | Off | No | Converts /bin <text> payloads into 8-bit binary octets before sending. |
| [BlockDebugTelemetry](../runtime/src/plugins/blockDebugTelemetry/README.md) | Off | No | Drops internal debug and performance trace Flux dispatches locally. |
| [BypassSlowmodeDisplay](../runtime/src/plugins/bypassSlowmodeDisplay/README.md) | Off | Yes | Clears the client-side slowmode cooldown display lock in CooldownStore. |
| [ByteSizeMacro](../runtime/src/plugins/byteSizeMacro/README.md) | Off | No | Appends UTF-8 byte count on strings prefixed with `\\bytes:<text>`. |
| [CamelCaseMacro](../runtime/src/plugins/camelCaseMacro/README.md) | Off | No | Expands `\\camel:<words>` into camelCase identifiers on send. |
| [CharacterCountTag](../runtime/src/plugins/characterCountTag/README.md) | Off | No | Appends a subtle character count footer to outgoing messages over 20 chars. |
| [CopyableChannelIdMacro](../runtime/src/plugins/copyableChannelIdMacro/README.md) | Off | No | Expands `\\cid` macros into the current Discord channel snowflake ID on send. |
| [DeveloperMode](../runtime/src/plugins/developerMode/README.md) | On | Yes | Forces Discord internal developer options flag to enabled. |
| [EpochDecodeMacro](../runtime/src/plugins/epochDecodeMacro/README.md) | Off | No | Expands `\\epoch:<unix>` macros into ISO-8601 UTC date strings on send. |
| [Experiments](../runtime/src/plugins/experiments/README.md) | Off | Yes | Unlocks Discord internal Experiments and Staff developer settings tabs. |
| [HexColorPreviewTag](../runtime/src/plugins/hexColorPreviewTag/README.md) | Off | No | Expands `\\hex:#RRGGBB` macros into hex + RGB color values on send. |
| [HexEncodeMacro](../runtime/src/plugins/hexEncodeMacro/README.md) | Off | No | Converts /hex <text> payloads into space-separated hexadecimal bytes. |
| [InspectMessageIdBadge](../runtime/src/plugins/inspectMessageIdBadge/README.md) | Off | No | Shows the trailing 6 digits of each message ID beside its timestamp. |
| [JsonFormatMacro](../runtime/src/plugins/jsonFormatMacro/README.md) | Off | No | Expands `\\json:{...}` macros into formatted JSON code blocks on send. |
| [JsonMinifyMacro](../runtime/src/plugins/jsonMinifyMacro/README.md) | Off | No | Compresses `\\jmin:{...}` JSON payloads into compact single-line strings on send. |
| [LoremIpsumMacro](../runtime/src/plugins/loremIpsumMacro/README.md) | Off | No | Expands /lorem into standard placeholder text for UI or chat layout tests. |
| [MonospaceNumbers](../runtime/src/plugins/monospaceNumbers/README.md) | Off | No | Converts ASCII digits in outgoing text into Unicode monospace numerals. |
| [ReactErrorDecoder](../runtime/src/plugins/reactErrorDecoder/README.md) | Off | No | Appends readable explanations when Discord logs minified React error codes. |
| [RegexEscapeMacro](../runtime/src/plugins/regexEscapeMacro/README.md) | Off | No | Escapes regular-expression metacharacters via `\\re:<literal>` on send. |
| [SlugifyMacro](../runtime/src/plugins/slugifyMacro/README.md) | Off | No | Expands `\\slug:<text>` into kebab-case `my-slug-text` slugs on send. |
| [SnakeCaseMacro](../runtime/src/plugins/snakeCaseMacro/README.md) | Off | No | Expands `\\snake:<words>` into `snake_case` identifiers on send. |
| [SnowflakeAgeBadge](../runtime/src/plugins/snowflakeAgeBadge/README.md) | Off | No | Displays relative message age (`2h ago`, `3d ago`) next to chat timestamps. |
| [SnowflakeIdsInChat](../runtime/src/plugins/snowflakeIdsInChat/README.md) | Off | No | Appends message snowflake ID suffixes directly to message headers. |
| [UnixNowMacro](../runtime/src/plugins/unixNowMacro/README.md) | Off | No | Replaces /unixnow with Discord dynamic timestamp markup for the current time. |
| [UnixTimestamps](../runtime/src/plugins/unixTimestamps/README.md) | Off | No | Appends exact Unix epoch seconds to chat message timestamps. |
| [UrlDecodeMacro](../runtime/src/plugins/urlDecodeMacro/README.md) | Off | No | Expands `\\udec:<percent-encoded>` into decoded plain strings on send. |
| [UrlEncodeMacro](../runtime/src/plugins/urlEncodeMacro/README.md) | Off | No | Percent-encodes /urlencode <text> values safely before sending. |

## Nitro (11)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [AlwaysAnimate](../runtime/src/plugins/alwaysAnimate/README.md) | Off | Yes | Keeps GIFs, custom emojis, and stickers animating automatically. |
| [DisableReducedMotionLock](../runtime/src/plugins/disableReducedMotionLock/README.md) | Off | Yes | Prevents reduced-motion flags from freezing animated Nitro assets. |
| [FakeNitro](../runtime/src/plugins/fakeNitro/README.md) | On | Yes | Unlocks locked emojis, stickers, and client Nitro perks with native chat rendering. |
| [ForceNitroVisuals](../runtime/src/plugins/forceNitroVisuals/README.md) | Off | Yes | Spoofs local Nitro Full badge visibility on your own current user object. |
| [HidePremiumUpsells](../runtime/src/plugins/hidePremiumUpsells/README.md) | Off | Yes | Suppresses client Nitro upsell prompts across pickers and settings menus. |
| [HighlightStickersInChat](../runtime/src/plugins/highlightStickersInChat/README.md) | Off | No | Highlights messages containing custom or Nitro stickers with a purple gutter. |
| [NoGifAutoplay](../runtime/src/plugins/noGifAutoplay/README.md) | Off | No | Stops animated GIFs in chat from auto-playing until tapped. |
| [SpotifyCrack](../runtime/src/plugins/spotifyCrack/README.md) | Off | No | Unlocks Spotify Listen Along and pauses-on-speak prevention without Spotify Premium. |
| [UnlockAppIcons](../runtime/src/plugins/unlockAppIcons/README.md) | Off | No | Unlocks custom client app icon selector checks without a Nitro subscription. |
| [UnlockBurstChecks](../runtime/src/plugins/unlockBurstChecks/README.md) | Off | Yes | Clears client cooldown and upsell gates on burst super-reaction checks. |
| [UnlockClientThemes](../runtime/src/plugins/unlockClientThemes/README.md) | Off | Yes | Unlocks preview access to Nitro client themes and custom background checks. |

## Voice (17)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [BlockStreamPreview](../runtime/src/plugins/blockStreamPreview/README.md) | Off | No | Stops Discord from uploading live Go Live stream preview thumbnails. |
| [BlockVoiceChannelStatus](../runtime/src/plugins/blockVoiceChannelStatus/README.md) | Off | No | Hides custom voice channel status updates from being tracked. |
| [BlockVoiceEffects](../runtime/src/plugins/blockVoiceEffects/README.md) | Off | No | Blocks incoming voice soundboard plays and voice channel effect animations. |
| [CallAlertLogger](../runtime/src/plugins/callAlertLogger/README.md) | Off | No | Logs incoming DM and group voice call rings to the Nekocord Notification Log. |
| [CallTimer](../runtime/src/plugins/callTimer/README.md) | Off | No | Measures active voice call session duration and logs exact elapsed time on leave. |
| [DisableCallIdle](../runtime/src/plugins/disableCallIdle/README.md) | Off | No | Prevents automatic idle disconnection timeouts while sitting in voice calls. |
| [FakeDeafen](../runtime/src/plugins/fakeDeafen/README.md) | Off | No | Spoofs self-deafen and self-mute to Discord voice gateway while keeping audio active. |
| [KeepVoiceAlive](../runtime/src/plugins/keepVoiceAlive/README.md) | Off | No | Prevents automatic idle voice call disconnect timeouts locally. |
| [StreamerModeOnStream](../runtime/src/plugins/streamerModeOnStream/README.md) | Off | No | Automatically toggles Discord Streamer Mode when starting or ending a stream. |
| [VoiceChannelAudit](../runtime/src/plugins/voiceChannelAudit/README.md) | Off | No | Counts and records voice channel join/leave updates for diagnostics. |
| [VoiceDeafenOnJoin](../runtime/src/plugins/voiceDeafenOnJoin/README.md) | Off | No | Automatically self-deafens whenever you connect into a voice channel. |
| [VoiceDeafenOnLeave](../runtime/src/plugins/voiceDeafenOnLeave/README.md) | Off | No | Automatically self-deafens whenever disconnecting from a voice channel. |
| [VoiceJoinNotifier](../runtime/src/plugins/voiceJoinNotifier/README.md) | Off | No | Logs and optionally toasts when users join or leave your active voice channel. |
| [VoiceMuteOnDeafen](../runtime/src/plugins/voiceMuteOnDeafen/README.md) | Off | No | Automatically ensures self-mute toggles on whenever self-deafening. |
| [VoiceMuteOnJoin](../runtime/src/plugins/voiceMuteOnJoin/README.md) | Off | No | Automatically mutes your microphone when joining or switching voice channels. |
| [VoiceUnmuteOnLeave](../runtime/src/plugins/voiceUnmuteOnLeave/README.md) | Off | No | Clears local self-mute automatically when leaving a voice call. |
| [VolumeBooster](../runtime/src/plugins/volumeBooster/README.md) | Off | No | Allows boosting voice participant volumes up to 400% beyond standard sliders. |

## Core (1)

| Plugin | Default | Restart | Description |
| :--- | :--- | :--- | :--- |
| [NekocordBanner](../runtime/src/plugins/nekocordBanner/README.md) | On | No | Logs Nekocord startup diagnostics and verifies Metro module discovery. |
