import { KnowledgeBaseArticle, IncidentCategory } from '../types';

class KnowledgeBaseService {
  private articles: Map<string, KnowledgeBaseArticle> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeSampleArticles();
  }

  private initializeSampleArticles() {
    const articles: KnowledgeBaseArticle[] = [
      {
        id: 'kb-001',
        title: 'Medical Emergency Response Protocol',
        category: 'Medical',
        content: 'Step-by-step guide for responding to medical emergencies including CPR, wound care, and shock management.',
        tags: ['medical', 'cpr', 'first-aid', 'emergency'],
        views: 1240,
        helpful: 892,
        unhelpful: 34,
        lastUpdated: Date.now() - 86400000,
        author: 'Dr. Sarah Chen'
      },
      {
        id: 'kb-002',
        title: 'Fire Safety and Evacuation Procedures',
        category: 'Fire',
        content: 'Comprehensive guide on fire safety, evacuation routes, and containment strategies for various fire types.',
        tags: ['fire', 'safety', 'evacuation', 'hazmat'],
        views: 856,
        helpful: 723,
        unhelpful: 28,
        lastUpdated: Date.now() - 172800000,
        author: 'Chief Marcus Brown'
      },
      {
        id: 'kb-003',
        title: 'Flood Response and Rescue Operations',
        category: 'Flood',
        content: 'Water rescue techniques, equipment needed, and coordination strategies for flood emergencies.',
        tags: ['flood', 'water-rescue', 'drowning', 'evacuation'],
        views: 654,
        helpful: 521,
        unhelpful: 42,
        lastUpdated: Date.now() - 259200000,
        author: 'Water Rescue Specialist'
      },
      {
        id: 'kb-004',
        title: 'Communication Best Practices in Crisis',
        category: 'Communications',
        content: 'Clear communication protocols to prevent miscommunication during high-stress incidents.',
        tags: ['comms', 'coordination', 'protocol', 'teamwork'],
        views: 1523,
        helpful: 1187,
        unhelpful: 19,
        lastUpdated: Date.now() - 604800000,
        author: 'Communication Team Lead'
      },
      {
        id: 'kb-005',
        title: 'Hazmat Identification and Initial Response',
        category: 'Hazard',
        content: 'How to safely identify hazardous materials and take appropriate initial response actions.',
        tags: ['hazmat', 'chemical', 'safety', 'identification'],
        views: 432,
        helpful: 356,
        unhelpful: 24,
        lastUpdated: Date.now() - 345600000,
        author: 'HAZMAT Team'
      },
      {
        id: 'kb-006',
        title: 'Earthquake Response and Building Safety',
        category: 'Earthquake',
        content: 'Immediate actions during earthquakes, structural assessment, and aftershock preparation.',
        tags: ['earthquake', 'structural', 'safety', 'aftershocks'],
        views: 789,
        helpful: 612,
        unhelpful: 31,
        lastUpdated: Date.now() - 432000000,
        author: 'Structural Engineer'
      },
      {
        id: 'kb-007',
        title: 'Mental Health Support in Crisis Situations',
        category: 'Mental Health',
        content: 'Recognizing trauma, providing psychological first aid, and supporting survivors.',
        tags: ['mental-health', 'trauma', 'support', 'crisis'],
        views: 967,
        helpful: 821,
        unhelpful: 38,
        lastUpdated: Date.now() - 86400000,
        author: 'Mental Health Professional'
      }
    ];

    articles.forEach(article => {
      this.articles.set(article.id, article);
      // Build search index
      const keywords = [...article.tags, article.title, article.category].map(k => k.toLowerCase());
      keywords.forEach(keyword => {
        if (!this.searchIndex.has(keyword)) {
          this.searchIndex.set(keyword, new Set());
        }
        this.searchIndex.get(keyword)!.add(article.id);
      });
    });
  }

  /**
   * Search articles by keyword
   */
  searchArticles(query: string, limit: number = 10): KnowledgeBaseArticle[] {
    const queryTerms = query.toLowerCase().split(' ');
    const resultIds = new Set<string>();

    queryTerms.forEach(term => {
      const matches = this.searchIndex.get(term) || new Set();
      matches.forEach(id => resultIds.add(id));
    });

    return Array.from(resultIds)
      .map(id => this.articles.get(id)!)
      .sort((a, b) => (b.views + b.helpful) - (a.views + a.helpful))
      .slice(0, limit);
  }

  /**
   * Get articles by category
   */
  getByCategory(category: string): KnowledgeBaseArticle[] {
    return Array.from(this.articles.values()).filter(
      article => article.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get articles by incident category
   */
  getByIncidentCategory(incidentCategory: IncidentCategory): KnowledgeBaseArticle[] {
    return this.getByCategory(incidentCategory);
  }

  /**
   * Get single article
   */
  getArticle(id: string): KnowledgeBaseArticle | undefined {
    return this.articles.get(id);
  }

  /**
   * Get trending articles
   */
  getTrendingArticles(limit: number = 5): KnowledgeBaseArticle[] {
    return Array.from(this.articles.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Get most helpful articles
   */
  getMostHelpful(limit: number = 5): KnowledgeBaseArticle[] {
    return Array.from(this.articles.values())
      .map(article => ({
        ...article,
        helpfulnessScore: article.helpful / (article.helpful + article.unhelpful + 1)
      }))
      .sort((a, b) => (b as any).helpfulnessScore - (a as any).helpfulnessScore)
      .slice(0, limit);
  }

  /**
   * Mark article as helpful
   */
  markHelpful(articleId: string): void {
    const article = this.articles.get(articleId);
    if (article) {
      article.helpful++;
    }
  }

  /**
   * Mark article as unhelpful
   */
  markUnhelpful(articleId: string): void {
    const article = this.articles.get(articleId);
    if (article) {
      article.unhelpful++;
    }
  }

  /**
   * Record article view
   */
  recordView(articleId: string): void {
    const article = this.articles.get(articleId);
    if (article) {
      article.views++;
    }
  }

  /**
   * Add new article
   */
  addArticle(article: KnowledgeBaseArticle): void {
    this.articles.set(article.id, article);
    // Update search index
    const keywords = [...article.tags, article.title, article.category].map(k => k.toLowerCase());
    keywords.forEach(keyword => {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, new Set());
      }
      this.searchIndex.get(keyword)!.add(article.id);
    });
  }

  /**
   * Get articles related to incident resolution
   */
  getResolutionGuides(category: IncidentCategory): KnowledgeBaseArticle[] {
    const guides = this.getByIncidentCategory(category);
    return guides.sort((a, b) => (b.helpful - b.unhelpful) - (a.helpful - a.unhelpful));
  }

  /**
   * Get incident classification training articles
   */
  getClassificationTraining(): KnowledgeBaseArticle[] {
    return Array.from(this.articles.values()).filter(
      article => article.tags.includes('classification') || article.tags.includes('identification')
    );
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
