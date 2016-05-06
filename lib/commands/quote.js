'use strict';

const moment = require('moment');
const Command = require('./command');

class Quote extends Command {
  run(symbols) {
    return new Promise((resolve, reject) => {
      // Grab snapshots for the stocks
      this.yahoo.snapshot({
        symbols,
        fields: this.DEFAULT_FIELDS,
      }, (err, snapshots) => {
        if (!err) {
          const responses = [];

          let found = false;

          snapshots.forEach((snapshot) => {
            // Only include valid symbols
            if (snapshot.name !== null) {
              found = true;

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
                  color: this.getSymbolColor(change),
                  text: `${this.getSymbolTrend(change)}` +
                    ` *${snapshot.name} (${this.getSymbolLink(snapshot.symbol)})*\n` +
                    `$${snapshot.lastTradePriceOnly.format(2)} ${change.format(2)}` +
                    ` (${(snapshot.changeInPercent * 100).format(2)}%)` +
                    ` - ${moment(snapshot.lastTradeDate).format('MMM Do')},` +
                    ` ${snapshot.lastTradeTime}\n${range}${volume}`,
                  mrkdwn_in: ['text', 'pretext'],
                  image_url: this.getSymbolChart(snapshot.symbol, 1),
                }],
              });
            }
          });

          if (!found) {
            reject('Sorry, I could not find any valid symbols');
          } else {
            resolve(responses);
          }
        }
      });
    });
  }
}

module.exports = new Quote();