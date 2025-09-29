// Baseline scoring model using TF-IDF + cosine similarity
class BaselineScorer {
  constructor() {
    // Grade band thresholds (cosine similarity scores)
    this.gradeBands = {
      A: 0.85,  // ≥85% similarity
      B: 0.70,  // ≥70% similarity  
      C: 0.55,  // ≥55% similarity
      D: 0.40,  // ≥40% similarity
      E: 0.25,  // ≥25% similarity
      F: 0.00   // <25% similarity
    };

    // Exemplar answers for different quality levels
    this.exemplars = {
      mathematics: {
        excellent: `
          Lösning av andragradsekvation med faktorisering
          Steg 1: Identifiera ekvationstyp standardform ax² + bx + c = 0
          Steg 2: Hitta faktorer för faktorisering
          Steg 3: Faktorisering och tillämpa nollproduktregeln
          Steg 4: Verifiering av lösningarna
          Slutsats med korrekt svar
        `,
        good: `
          Andragradsekvation lösning
          Faktorisering metod
          Hitta faktorer
          Lösningar med nollproduktregeln
          Kontroll av svar
        `,
        basic: `
          Ekvation
          Faktorisering
          Lösningar
          Svar
        `
      }
    };

    // Mathematical keywords with weights
    this.mathKeywords = {
      // Method words
      'faktorisering': 3,
      'kvadratkomplettering': 3,
      'pq-formeln': 3,
      'abc-formeln': 3,
      'substitution': 2,
      'elimination': 2,
      
      // Process words
      'steg': 2,
      'metod': 2,
      'lösning': 2,
      'beräkning': 2,
      'analys': 2,
      
      // Verification words
      'kontroll': 3,
      'verifiering': 3,
      'kontrollera': 2,
      'bekräfta': 2,
      
      // Mathematical terms
      'ekvation': 1,
      'andragradsekvation': 2,
      'koefficient': 2,
      'konstant': 1,
      'variabel': 1,
      'funktion': 1,
      
      // Solution words
      'svar': 2,
      'resultat': 1,
      'slutsats': 2,
      'lösningar': 2
    };
  }

  // Simple tokenization and cleaning
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\wåäöÅÄÖ\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  // Calculate TF-IDF scores
  calculateTFIDF(documents) {
    const allTokens = documents.flatMap(doc => this.tokenize(doc));
    const vocabulary = [...new Set(allTokens)];
    const docCount = documents.length;

    return documents.map(doc => {
      const tokens = this.tokenize(doc);
      const tokenCounts = {};
      
      // Count token frequencies
      tokens.forEach(token => {
        tokenCounts[token] = (tokenCounts[token] || 0) + 1;
      });

      const vector = {};
      vocabulary.forEach(term => {
        const tf = (tokenCounts[term] || 0) / tokens.length;
        const docsWithTerm = documents.filter(d => 
          this.tokenize(d).includes(term)
        ).length;
        const idf = Math.log(docCount / (docsWithTerm || 1));
        vector[term] = tf * idf;
      });

      return vector;
    });
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vectorA, vectorB) {
    const keysA = Object.keys(vectorA);
    const keysB = Object.keys(vectorB);
    const allKeys = [...new Set([...keysA, ...keysB])];

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    allKeys.forEach(key => {
      const valueA = vectorA[key] || 0;
      const valueB = vectorB[key] || 0;
      
      dotProduct += valueA * valueB;
      normA += valueA * valueA;
      normB += valueB * valueB;
    });

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // Calculate keyword coverage bonus
  calculateKeywordBonus(text, subject) {
    const tokens = this.tokenize(text);
    const keywords = this.mathKeywords;
    
    let totalWeight = 0;
    let foundWeight = 0;

    Object.entries(keywords).forEach(([keyword, weight]) => {
      totalWeight += weight;
      if (tokens.includes(keyword)) {
        foundWeight += weight;
      }
    });

    return totalWeight > 0 ? foundWeight / totalWeight : 0;
  }

  // Calculate structure bonus based on indicators
  calculateStructureBonus(text) {
    const indicators = [
      /steg\s*\d+/i,           // "Steg 1", "Steg 2", etc.
      /\d+[\.:]\s/g,           // "1:", "2.", etc.
      /svar\s*:/i,             // "Svar:"
      /slutsats/i,             // "Slutsats"
      /kontroll/i,             // "Kontroll"
      /verifiering/i           // "Verifiering"
    ];

    const foundIndicators = indicators.filter(pattern => 
      pattern.test(text)
    ).length;

    return Math.min(foundIndicators / indicators.length, 1.0);
  }

  // Main scoring function
  scoreText(text, subject = 'mathematics') {
    const startTime = Date.now();

    // Get exemplars for the subject
    const exemplars = this.exemplars[subject] || this.exemplars.mathematics;
    const documents = [
      text,
      exemplars.excellent,
      exemplars.good,
      exemplars.basic
    ];

    // Calculate TF-IDF vectors
    const tfidfVectors = this.calculateTFIDF(documents);
    const [submissionVector, excellentVector, goodVector, basicVector] = tfidfVectors;

    // Calculate similarities to each exemplar
    const similarities = {
      excellent: this.cosineSimilarity(submissionVector, excellentVector),
      good: this.cosineSimilarity(submissionVector, goodVector),
      basic: this.cosineSimilarity(submissionVector, basicVector)
    };

    // Base similarity score (highest similarity to any exemplar)
    const baseSimilarity = Math.max(...Object.values(similarities));

    // Calculate bonus scores
    const keywordBonus = this.calculateKeywordBonus(text, subject);
    const structureBonus = this.calculateStructureBonus(text);

    // Combined score with bonuses
    const combinedScore = Math.min(
      baseSimilarity + (keywordBonus * 0.1) + (structureBonus * 0.1),
      1.0
    );

    // Convert to 0-100 scale
    const scorePercentage = Math.round(combinedScore * 100);

    // Determine grade band
    let gradeBand = 'F';
    for (const [grade, threshold] of Object.entries(this.gradeBands)) {
      if (combinedScore >= threshold) {
        gradeBand = grade;
        break;
      }
    }

    // Generate explanation
    const explanation = this.generateExplanation(
      similarities, 
      keywordBonus, 
      structureBonus, 
      gradeBand
    );

    const processingTime = Date.now() - startTime;

    return {
      predicted_score: scorePercentage,
      predicted_band: gradeBand,
      confidence: Math.min(baseSimilarity + 0.2, 1.0), // Baseline confidence
      reason: explanation,
      model_used: 'TF-IDF Baseline Model',
      processing_time_ms: processingTime,
      analysis_breakdown: {
        content_similarity: baseSimilarity,
        keyword_coverage: keywordBonus,
        structure_quality: structureBonus,
        combined_score: combinedScore
      }
    };
  }

  // Generate human-readable explanation
  generateExplanation(similarities, keywordBonus, structureBonus, grade) {
    const maxSim = Math.max(...Object.values(similarities));
    const simLevel = maxSim > 0.8 ? 'hög' : maxSim > 0.5 ? 'medel' : 'låg';
    
    let explanation = `Texten visar ${simLevel} likhet med exempel på bra lösningar (${(maxSim * 100).toFixed(1)}%). `;
    
    if (keywordBonus > 0.7) {
      explanation += 'Innehåller många relevanta matematiska termer. ';
    } else if (keywordBonus > 0.4) {
      explanation += 'Innehåller några matematiska termer. ';
    } else {
      explanation += 'Saknar många viktiga matematiska termer. ';
    }
    
    if (structureBonus > 0.6) {
      explanation += 'Väl strukturerad lösning med tydliga steg. ';
    } else if (structureBonus > 0.3) {
      explanation += 'Viss struktur men kan förbättras. ';
    } else {
      explanation += 'Saknar tydlig struktur och stegvis lösning. ';
    }

    // Grade-specific feedback
    const gradeComments = {
      A: 'Utmärkt lösning med hög kvalitet.',
      B: 'Bra lösning med mindre förbättringsmöjligheter.',
      C: 'Acceptabel lösning men saknar detaljer.',
      D: 'Grundläggande lösning som behöver utvecklas.',
      E: 'Ofullständig lösning med stora brister.',
      F: 'Otillräcklig lösning som inte uppfyller kraven.'
    };

    explanation += gradeComments[grade] || '';
    
    return explanation;
  }
}

// Export singleton instance
export const baselineScorer = new BaselineScorer();