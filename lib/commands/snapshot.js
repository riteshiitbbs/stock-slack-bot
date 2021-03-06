'use strict';

const moment = require('moment');
const Command = require('./command');

class Snapshot extends Command {
  constructor(lookup) {
    super(lookup);
    this.name = 'Snapshot';
    this.triggers = /^\b(snapshot|s)\b/i;
    this.aliases = ['snapshot', 's'];
  }

  help(bot) {
    return new Promise((resolve) => {
      resolve(
        'Provides a near real time quote for the requested symbol.  Information ' +
        'includes current price, volume, and current day\'s price range.\n' +
        `Triggers: [${this.aliases.join(', ')}]\n` +
        `To run command, type: \`@${bot.name} ${this.aliases[0]} $AAPL\`\n`
      );
    });
  }

  run(message) {
    return new Promise((resolve, reject) => {
      const symbols = this.extractSymbols(message.text);

      if (!symbols.length) {
        reject('Sorry, I could not find any symbols');
        return;
      }

      // Grab snapshots for the stocks
      this.yahoo.snapshot({
        symbols,
        fields: this.DEFAULT_FIELDS,
      }, (err, snapshots) => {
        if (!err) {
          const responses = [];

          snapshots.forEach((snapshot) => {
            // Only include valid symbols
            if (snapshot.name !== null) {
              const low = snapshot.daysLow ? `$${snapshot.daysLow.format(2)}` : '';
              const high = snapshot.daysHigh ? `$${snapshot.daysHigh.format(2)}` : '';
              let range = '';
              let volume = '';

              if (snapshot.daysLow && snapshot.daysHigh) {
                range = `Days Range: ${low}- ${high}\n`;
              }

              if (snapshot.volume) {
                volume = `Volume: ${snapshot.volume.format()}`;
              }

              let change = 0;

              if (snapshot.change) {
                change = snapshot.change;
              }

              responses.push({
                attachments: [{
                  fallback: `Snapshot for ${snapshot.symbol} ${this.getSymbolTrend(change)}`,
                  color: this.getSymbolColor(change),
                  text: `${this.getSymbolTrend(change)}` +
                    ` *${snapshot.name} (${this.getSymbolLink(snapshot.symbol)})*\n` +
                    `$${snapshot.lastTradePriceOnly.format(2)} ${change.format(2)}` +
                    ` (${(snapshot.changeInPercent * 100).format(2)}%)` +
                    ` - ${moment(snapshot.lastTradeDate).format('MMM Do')},` +
                    ` ${snapshot.lastTradeTime}\n${range}${volume}`,
                  mrkdwn_in: ['text', 'pretext'],
                }],
              });
            }
          });

          resolve(responses);
        }
      });
    });
  }
}

module.exports = Snapshot;
