'use strict';

/**
 * LiveAlertIntegration
 * Adapts MarketScanner analysis events into the AlertEngine domain boundary.
 * Keeps live scanner wiring out of the alert domain and provides deterministic
 * listener lifecycle management.
 */
class LiveAlertIntegration {
  constructor({ marketScanner, alertEngine }) {
    if (!marketScanner) throw new Error('LiveAlertIntegration requires a marketScanner');
    if (!alertEngine) throw new Error('LiveAlertIntegration requires an alertEngine');

    this.marketScanner = marketScanner;
    this.alertEngine = alertEngine;
    this.started = false;
    this.handleAnalysisUpdated = this.handleAnalysisUpdated.bind(this);
  }

  start() {
    if (this.started) return false;
    this.marketScanner.on('analysis-updated', this.handleAnalysisUpdated);
    this.started = true;
    return true;
  }

  handleAnalysisUpdated(update = {}) {
    const { symbol, analysis } = update;
    if (!symbol || !analysis || typeof analysis !== 'object') return [];

    const payloads = this.buildPayloads(symbol, analysis);
    const triggered = [];
    for (const payload of payloads) triggered.push(...this.alertEngine.process(payload));
    return triggered;
  }

  buildPayloads(symbol, analysis) {
    const payloads = [];
    const push = (payload) => {
      if (payload && Object.keys(payload).length > 1) payloads.push({ market: symbol, ...payload });
    };

    push(analysis);

    for (const [type, snapshot] of Object.entries({
      probability: analysis.probability,
      confidence: analysis.confidence,
      pattern: analysis.pattern,
      signal: analysis.signal,
      scanner: analysis.scanner,
    })) {
      if (snapshot == null) continue;
      if (typeof snapshot === 'object') {
        push({ type, ...snapshot });
        if (snapshot.confidence != null) push({ type, confidence: snapshot.confidence, value: snapshot.confidence });
        if (snapshot.probability != null) push({ type, probability: snapshot.probability });
      } else if (type === 'confidence') {
        push({ type, confidence: snapshot, value: snapshot });
      } else if (type === 'probability') {
        push({ type, probability: snapshot });
      }
    }

    for (const [type, snapshot] of Object.entries({
      evenOdd: analysis.evenOdd,
      matchesDiffers: analysis.matchesDiffers,
      riseFall: analysis.riseFall,
      overUnder: analysis.overUnder,
    })) {
      if (!snapshot || typeof snapshot !== 'object') continue;
      const confidence = snapshot.confidence ?? snapshot.probability;
      const probability = snapshot.probability;
      if (confidence != null) push({ type, confidence, value: confidence });
      if (probability != null) push({ type, probability });
    }

    return payloads;
  }

  stop() {
    if (!this.started) return false;
    this.marketScanner.off('analysis-updated', this.handleAnalysisUpdated);
    this.started = false;
    return true;
  }

  dispose() {
    this.stop();
  }
}

module.exports = LiveAlertIntegration;
