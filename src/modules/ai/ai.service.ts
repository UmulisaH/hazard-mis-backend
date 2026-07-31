import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import { PredictionResult } from './interfaces/training-record.interface';

type RandomForestClassifierInstance = {
  train(X: number[][], y: number[]): void;
  predict(X: number[][]): number[];
  predictProbability(X: number[][], label: number): number[];
  toJSON(): unknown;
};

type RandomForestClassifierStatic = {
  new (options: {
    nEstimators: number;
    maxDepth: number;
    seed: number;
    noOOB?: boolean;
  }): RandomForestClassifierInstance;
  load(json: unknown): RandomForestClassifierInstance;
};

const { RandomForestClassifier } = require('ml-random-forest') as {
  RandomForestClassifier: RandomForestClassifierStatic;
};

interface TrainingRow {
  title: string;
  description: string;
  hazard_category: string;
  severity_level: string;
  recurrence_count: number;
  is_weekend: number;
  actual_outcome: number;
}

interface ModelMetadata {
  version: string;
  trainedAt: string | null;
  totalRecords: number;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private classifier: RandomForestClassifierInstance | null = null;
  private modelMeta: ModelMetadata | null = null;
  private readonly modelVersion = 'v2.0';
  private readonly featureCount = 6;
  // The training set contains more low-risk than high-risk outcomes. Using
  // the library's default 0.50 majority-vote boundary made every valid
  // request classify as low, even when the positive-class probability was
  // materially high. This threshold is intentionally configurable so it can
  // be tuned against reviewed operational outcomes later.
  private readonly highPriorityProbabilityThreshold = 0.35;
  private readonly MODEL_PATH = path.join(
    process.cwd(),
    'models',
    'rf_model.json',
  );
  private readonly DATA_PATH = path.join(
    process.cwd(),
    'data',
    'training_data.csv',
  );

  private readonly hazardCategoryMap: Record<string, number> = {
    Machinery: 0,
    Chemical: 1,
    Electrical: 2,
    Ergonomic: 3,
    'Slip/Trip/Fall': 4,
    Fire: 5,
    Biological: 6,
  };

  private readonly severityLevelMap: Record<string, number> = {
    Low: 0,
    Medium: 1,
    High: 2,
    Critical: 3,
  };

  async onModuleInit(): Promise<void> {
    await this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    const modelsDir = path.dirname(this.MODEL_PATH);

    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    if (fs.existsSync(this.MODEL_PATH)) {
      try {
        const parsedModel = JSON.parse(fs.readFileSync(this.MODEL_PATH, 'utf8'));
        const storedFeatureCount = Number(
          parsedModel.featureCount ?? parsedModel.baseModel?.n ?? 0,
        );
        if (storedFeatureCount !== this.featureCount) {
          throw new Error(
            `Model feature count ${storedFeatureCount} does not match expected ${this.featureCount}`,
          );
        }

        this.classifier = RandomForestClassifier.load(parsedModel);
        this.modelMeta = {
          version: parsedModel.version ?? this.modelVersion,
          trainedAt: parsedModel.trainedAt ?? null,
          totalRecords: Number(parsedModel.totalRecords ?? 0),
        };
        this.logger.log(
          `✅ Model loaded successfully! Version: ${this.modelMeta.version}, Trained on: ${this.modelMeta.totalRecords} records`,
        );
        return;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.classifier = null;
        this.modelMeta = null;
        this.logger.warn(`Failed to load model: ${message}. Retraining...`);
      }
    }

    this.logger.log('No existing model found. Training from CSV...');
    await this.trainModel();
  }

  async trainModel(): Promise<void> {
    try {
      const records = await this.loadCsvData();

      if (records.length === 0) {
        this.classifier = null;
        this.modelMeta = null;
        this.logger.warn(
          '⚠️ No training data found. AI will use fallback rules.',
        );
        return;
      }

      const xTrain = records.map((record) =>
        this.encodeFeatures(
          record.hazard_category,
          record.severity_level,
          record.recurrence_count,
          Boolean(record.is_weekend),
          record.title,
          record.description,
        ),
      );
      const yTrain = records.map((record) => record.actual_outcome);

      this.logger.log(`📊 Loaded ${records.length} training records.`);

      const classifier = new RandomForestClassifier({
        nEstimators: 100,
        maxDepth: 10,
          seed: 42,
          noOOB: true,
        });

      classifier.train(xTrain, yTrain);

      const modelJSON = classifier.toJSON() as Record<string, unknown>;
      const trainedAt = new Date().toISOString();
      const storedModel = {
        ...modelJSON,
        version: this.modelVersion,
        featureCount: this.featureCount,
        trainedAt,
        totalRecords: records.length,
      };

      fs.writeFileSync(this.MODEL_PATH, JSON.stringify(storedModel, null, 2));
      this.classifier = classifier;
      this.modelMeta = {
        version: this.modelVersion,
        trainedAt,
        totalRecords: records.length,
      };

      this.logger.log(
        `✅ Model trained and saved successfully! Total records: ${records.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.classifier = null;
      this.modelMeta = null;
      this.logger.error(`❌ Failed to train model: ${message}`);
    }
  }

  private async loadCsvData(): Promise<TrainingRow[]> {
    return new Promise((resolve, reject) => {
      const results: TrainingRow[] = [];

      if (!fs.existsSync(this.DATA_PATH)) {
        this.logger.warn(`⚠️ CSV file not found at ${this.DATA_PATH}`);
        resolve([]);
        return;
      }

      let rowCount = 0;

      fs.createReadStream(this.DATA_PATH)
        .pipe(csvParser())
        .on('data', (data: Record<string, string>) => {
          rowCount++;

          const actualOutcomeRaw = data.actual_outcome;
          if (actualOutcomeRaw === undefined || actualOutcomeRaw === null) {
            return;
          }

          const actualOutcome = Number.parseInt(actualOutcomeRaw, 10);
          if (!Number.isFinite(actualOutcome)) {
            return;
          }

          const recurrenceCount = Number.parseInt(
            data.recurrence_count ?? '0',
            10,
          );
          const isWeekend = Number.parseInt(data.is_weekend ?? '0', 10);

          results.push({
            title: data.title ?? '',
            description: data.description ?? '',
            hazard_category: data.hazard_category ?? '',
            severity_level: data.severity_level ?? '',
            recurrence_count: Number.isFinite(recurrenceCount)
              ? recurrenceCount
              : 0,
            is_weekend: Number.isFinite(isWeekend) ? isWeekend : 0,
            actual_outcome: actualOutcome,
          });
        })
        .on('end', () => {
          this.logger.log(
            `📄 CSV loaded: ${results.length} valid records out of ${rowCount} rows.`,
          );
          resolve(results);
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }

  private encodeHazardCategory(hazardCategory: string): number {
    return this.hazardCategoryMap[hazardCategory] ?? 0;
  }

  private encodeSeverityLevel(severityLevel: string): number {
    return this.severityLevelMap[severityLevel] ?? 0;
  }

  private extractTextFeatures(title = '', description = ''): [number, number] {
    const text = `${title} ${description}`.toLowerCase();
    const riskTerms: Array<[RegExp, number]> = [
      [/\b(exposed|live|sparks?|smoke|fire|flame|explosion|flammable)\b/g, 2],
      [/\b(spill|leak|toxic|chemical|solvent|pesticide|gas|contamination)\b/g, 2],
      [/\b(injury|unsafe|faulty|broken|loose|missing|unguarded|blocked)\b/g, 1],
      [/\b(fall|electrocution|collapse|fume|fungal|infection)\b/g, 2],
    ];
    const urgencyTerms: RegExp[] = [
      /\b(urgent|urgently|immediate|immediately|emergency|critical|serious)\b/g,
      /\b(danger|dangerous|high[- ]risk|significant|harm)\b/g,
      /\b(repeated|recurring|multiple|again|reported)\b/g,
      /\b(closure|close|repair|fixing|mitigation)\b/g,
    ];

    const countMatches = (pattern: RegExp): number =>
      text.match(pattern)?.length ?? 0;

    const riskScore = Math.min(
      10,
      riskTerms.reduce(
        (score, [pattern, weight]) => score + countMatches(pattern) * weight,
        0,
      ),
    );
    const urgencyScore = Math.min(
      8,
      urgencyTerms.reduce((score, pattern) => score + countMatches(pattern), 0),
    );

    return [riskScore, urgencyScore];
  }

  private encodeFeatures(
    hazardCategory: string,
    severityLevel: string,
    recurrenceCount: number,
    isWeekend: boolean,
    title = '',
    description = '',
  ): [number, number, number, number, number, number] {
    const [textRiskScore, textUrgencyScore] = this.extractTextFeatures(
      title,
      description,
    );

    return [
      this.encodeHazardCategory(hazardCategory),
      this.encodeSeverityLevel(severityLevel),
      Number.isFinite(recurrenceCount) ? recurrenceCount : 0,
      isWeekend ? 1 : 0,
      textRiskScore,
      textUrgencyScore,
    ];
  }

  predictPriority(
    hazardCategory: string,
    severityLevel: string,
    recurrenceCount: number,
    isWeekend: boolean,
    title = '',
    description = '',
  ): PredictionResult {
    if (this.classifier) {
      const featureArray = this.encodeFeatures(
        hazardCategory,
        severityLevel,
        recurrenceCount,
        isWeekend,
        title,
        description,
      );

      // ml-random-forest's predictProbability API returns the probability for
      // the label supplied as its second argument. It does not return an
      // array containing one probability per class.
      const highProbabilityValues = this.classifier.predictProbability(
        [featureArray],
        1,
      );
      const highProbability = Number(highProbabilityValues[0] ?? 0);
      const safeHighProbability = Number.isFinite(highProbability)
        ? Math.min(1, Math.max(0, highProbability))
        : 0;
      const isHighPriority =
        safeHighProbability >= this.highPriorityProbabilityThreshold;
      const priority: 'High' | 'Low' = isHighPriority ? 'High' : 'Low';
      const confidenceRaw = isHighPriority
        ? safeHighProbability
        : 1 - safeHighProbability;
      const confidence = Math.round(confidenceRaw * 100) / 100;

      return { priority, confidence };
    }

    this.logger.warn('⚠️ Using fallback prediction (model not loaded)');
    return this.fallbackPrediction(
      hazardCategory,
      severityLevel,
      recurrenceCount,
      isWeekend,
      title,
      description,
    );
  }

  private fallbackPrediction(
    hazardCategory: string,
    severityLevel: string,
    recurrenceCount: number,
    isWeekend: boolean,
    title = '',
    description = '',
  ): PredictionResult {
    const severityWeights: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    const categoryMap: Record<string, number> = {
      Machinery: 1,
      Chemical: 2,
      Electrical: 3,
      Ergonomic: 4,
      'Slip/Trip/Fall': 5,
      Fire: 6,
      Biological: 7,
    };

    const severityWeight = severityWeights[severityLevel] ?? 2;
    const categoryWeight = categoryMap[hazardCategory] ?? 3;

    const [textRiskScore, textUrgencyScore] = this.extractTextFeatures(
      title,
      description,
    );
    let score =
      severityWeight * 5 +
      recurrenceCount * 3 +
      categoryWeight +
      textRiskScore * 2 +
      textUrgencyScore;

    if (isWeekend) {
      score += 2;
    }

    let priority: 'High' | 'Medium' | 'Low';
    let confidence: number;

    if (score >= 20) {
      priority = 'High';
      confidence = 0.85;
    } else if (score >= 12) {
      priority = 'Medium';
      confidence = 0.7;
    } else {
      priority = 'Low';
      confidence = 0.6;
    }

    return { priority, confidence };
  }

  getModelStatus(): {
    loaded: boolean;
    version: string | null;
    trainedAt: string | null;
    totalRecords: number;
  } {
    if (this.classifier) {
      return {
        loaded: true,
        version: this.modelMeta?.version ?? this.modelVersion,
        trainedAt: this.modelMeta?.trainedAt ?? null,
        totalRecords: this.modelMeta?.totalRecords ?? 0,
      };
    }

    return {
      loaded: false,
      version: null,
      trainedAt: null,
      totalRecords: 0,
    };
  }

  async retrainModel(): Promise<void> {
    this.logger.log('🔄 Retraining model...');

    if (fs.existsSync(this.MODEL_PATH)) {
      fs.unlinkSync(this.MODEL_PATH);
    }

    this.classifier = null;
    this.modelMeta = null;
    await this.trainModel();
    this.logger.log('✅ Model retrained successfully!');
  }
}
