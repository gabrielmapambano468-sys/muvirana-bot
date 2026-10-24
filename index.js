const { Telegraf } = require('telegraf');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TMDB = process.env.TMDB_API_KEY;

bot.start((ctx) => {
  ctx.reply('🎬 Karibu *TMBD MUVIRANA BOT* 🎬\n\nTuma jina la movie au series, nitakutafutia!\n\nMfano: Avatar, John Wick, Money Heist', { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
  const query = ctx.message.text;
  if (query.startsWith('/')) return;
  
  await ctx.reply(`🔍 Natafuta "${query}"...`);
  
  try {
    const res = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB}&query=${encodeURIComponent(query)}`);
    const result = res.data.results[0];
    
    if (!result) {
      return ctx.reply('😔 Sijapata kitu, jaribu jina lingine');
    }
    
    const title = result.title || result.name;
    const rating = result.vote_average.toFixed(1);
    const date = result.release_date || result.first_air_date || 'N/A';
    const overview = result.overview ? result.overview.substring(0, 800) : 'Hakuna maelezo';
    const poster = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null;

    const caption = `🎬 *${title}*\n\n⭐ Rating: ${rating}/10\n📅 Tarehe: ${date}\n🎭 Aina: ${result.media_type}\n\n📝 *Hadithi:*\n${overview}\n\n_TMBD Muvirana Bot_`;

    if (poster) {
      await ctx.replyWithPhoto(poster, { caption, parse_mode: 'Markdown' });
    } else {
      await ctx.reply(caption, { parse_mode: 'Markdown' });
    }

    // Save to Supabase
    try {
      await supabase.from('searches').insert({ query: query, result: title });
    } catch(e) {}

  } catch (err) {
    console.error(err);
    ctx.reply('❌ Error: ' + err.message);
  }
});

bot.launch().then(() => console.log('Bot Started!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
