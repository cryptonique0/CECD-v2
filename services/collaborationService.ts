import { TeamSession, TeamMessage, SharedResource, ServiceRequest, Severity } from '../types';

class CollaborationService {
  private sessions: Map<string, TeamSession> = new Map();
  private presenceData: Map<string, { userId: string; status: 'online' | 'offline'; lastSeen: number }> = new Map();
  private serviceRequests: Map<string, ServiceRequest> = new Map();

  /**
   * Create or get a team session for an incident
   */
  createSession(incidentId: string, initiatorId: string): TeamSession {
    let session = Array.from(this.sessions.values()).find(s => s.incidentId === incidentId);
    
    if (!session) {
      session = {
        id: `session-${Date.now()}`,
        incidentId,
        participantIds: [initiatorId],
        createdAt: Date.now(),
        messages: [],
        sharedResources: []
      };
      this.sessions.set(session.id, session);
    } else if (!session.participantIds.includes(initiatorId)) {
      session.participantIds.push(initiatorId);
    }

    return session;
  }

  /**
   * Add participant to session
   */
  addParticipant(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.participantIds.includes(userId)) {
      session.participantIds.push(userId);
    }
  }

  /**
   * Send team message
   */
  sendMessage(sessionId: string, senderId: string, content: string, type: 'text' | 'resource' | 'assignment' | 'status' = 'text'): TeamMessage {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const message: TeamMessage = {
      id: `msg-${Date.now()}`,
      senderId,
      content,
      type,
      timestamp: Date.now(),
      seenBy: [senderId]
    };

    session.messages.push(message);
    return message;
  }

  /**
   * Mark message as seen
   */
  markMessageSeen(sessionId: string, messageId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const message = session.messages.find(m => m.id === messageId);
    if (message && !message.seenBy.includes(userId)) {
      message.seenBy.push(userId);
    }
  }

  /**
   * Share resource in session
   */
  shareResource(sessionId: string, resourceId: string, sharedBy: string): SharedResource {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const resource: SharedResource = {
      id: `resource-${Date.now()}`,
      resourceId,
      sharedBy,
      sharedAt: Date.now(),
      viewers: []
    };

    session.sharedResources.push(resource);
    return resource;
  }

  /**
   * Update presence status
   */
  updatePresence(userId: string, status: 'online' | 'offline'): void {
    this.presenceData.set(userId, {
      userId,
      status,
      lastSeen: Date.now()
    });
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): { status: 'online' | 'offline'; lastSeen: number } {
    const presence = this.presenceData.get(userId);
    return presence ? { status: presence.status, lastSeen: presence.lastSeen } : { status: 'offline', lastSeen: 0 };
  }

  /**
   * Get session participants with presence
   */
  getSessionParticipantsPresence(sessionId: string): Array<{ userId: string; status: 'online' | 'offline' }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.participantIds.map(userId => {
      const presence = this.presenceData.get(userId);
      return {
        userId,
        status: presence?.status || 'offline'
      };
    });
  }

  /**
   * Get session
   */
  getSession(sessionId: string): TeamSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session by incident
   */
  getSessionByIncident(incidentId: string): TeamSession | undefined {
    return Array.from(this.sessions.values()).find(s => s.incidentId === incidentId);
  }

  /**
   * End session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endedAt = Date.now();
    }
  }

  /**
   * Get chat history for session
   */
  getChatHistory(sessionId: string, limit: number = 50): TeamMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.messages.slice(-limit);
  }

  /**
   * Create service request
   */
  createServiceRequest(
    requesterId: string,
    category: string,
    description: string,
    location: string,
    lat: number,
    lng: number,
    priority: Severity,
    estimatedDuration: number
  ): ServiceRequest {
    const request: ServiceRequest = {
      id: `sr-${Date.now()}`,
      requesterId,
      category,
      description,
      location,
      lat,
      lng,
      status: 'Open',
      priority,
      assignedVolunteers: [],
      createdAt: Date.now(),
      estimatedDuration
    };

    this.serviceRequests.set(request.id, request);
    return request;
  }

  /**
   * Assign volunteer to service request
   */
  assignVolunteer(requestId: string, volunteerId: string): void {
    const request = this.serviceRequests.get(requestId);
    if (request) {
      if (!request.assignedVolunteers.includes(volunteerId)) {
        request.assignedVolunteers.push(volunteerId);
        if (request.status === 'Open') {
          request.status = 'Assigned';
        }
      }
    }
  }

  /**
   * Update service request status
   */
  updateServiceRequestStatus(requestId: string, status: 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled'): void {
    const request = this.serviceRequests.get(requestId);
    if (request) {
      request.status = status;
      if (status === 'Completed') {
        request.completedAt = Date.now();
      }
    }
  }

  /**
   * Get service request
   */
  getServiceRequest(requestId: string): ServiceRequest | undefined {
    return this.serviceRequests.get(requestId);
  }

  /**
   * Get service requests by status
   */
  getServiceRequestsByStatus(status: string): ServiceRequest[] {
    return Array.from(this.serviceRequests.values()).filter(r => r.status === status);
  }

  /**
   * Get service requests assigned to volunteer
   */
  getAssignedToVolunteer(volunteerId: string): ServiceRequest[] {
    return Array.from(this.serviceRequests.values()).filter(r => r.assignedVolunteers.includes(volunteerId));
  }

  /**
   * Get open service requests near location
   */
  getNearbyRequests(lat: number, lng: number, radiusKm: number = 10): ServiceRequest[] {
    const radiusDeg = radiusKm / 111; // Rough conversion to degrees

    return Array.from(this.serviceRequests.values()).filter(r => {
      if (r.status === 'Completed' || r.status === 'Cancelled') return false;
      
      const distance = Math.sqrt(
        Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2)
      );
      
      return distance <= radiusDeg;
    });
  }

  /**
   * Get activity summary for incident coordination
   */
  getIncidentActivitySummary(incidentId: string): {
    participantCount: number;
    messageCount: number;
    sharedResourceCount: number;
    lastActivity: number;
  } {
    const session = this.getSessionByIncident(incidentId);
    if (!session) {
      return {
        participantCount: 0,
        messageCount: 0,
        sharedResourceCount: 0,
        lastActivity: 0
      };
    }

    const lastMessageTime = session.messages.length > 0 
      ? session.messages[session.messages.length - 1].timestamp 
      : session.createdAt;

    return {
      participantCount: session.participantIds.length,
      messageCount: session.messages.length,
      sharedResourceCount: session.sharedResources.length,
      lastActivity: lastMessageTime
    };
  }

  /**
   * Search service requests
   */
  searchServiceRequests(query: string): ServiceRequest[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.serviceRequests.values()).filter(r => 
      r.category.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.location.toLowerCase().includes(lowerQuery)
    );
  }
}

export const collaborationService = new CollaborationService();
