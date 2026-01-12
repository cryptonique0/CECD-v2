export interface ResourceInventory {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minimumQuantity: number;
  maximumQuantity: number;
  location: string;
  lastRestocked: number;
  reorderPoint: number;
  supplier?: string;
  cost?: number;
}

export interface ResourceAllocation {
  id: string;
  incidentId: string;
  resourceId: string;
  quantityAllocated: number;
  allocatedAt: number;
  allocatedBy: string;
  status: 'pending' | 'delivered' | 'in-use' | 'returned';
  expectedReturnTime?: number;
  actualReturnTime?: number;
  notes?: string;
}

export interface ResourceDistribution {
  id: string;
  fromLocation: string;
  toIncidentId: string;
  resources: Array<{ resourceId: string; quantity: number }>;
  distance: number;
  estimatedTimeMinutes: number;
  startTime: number;
  completionTime?: number;
  status: 'planned' | 'in-transit' | 'delivered' | 'cancelled';
}

interface InventoryService {
  addResource(resource: Omit<ResourceInventory, 'id'>): ResourceInventory;
  getResource(id: string): ResourceInventory | null;
  listResources(category?: string): ResourceInventory[];
  updateStock(resourceId: string, quantity: number): void;
  allocateResource(incidentId: string, resourceId: string, quantity: number, allocatedBy: string): ResourceAllocation;
  deallocateResource(allocationId: string): boolean;
  getIncidentAllocations(incidentId: string): ResourceAllocation[];
  getLowStockItems(): ResourceInventory[];
  planDistribution(incidentId: string, resources: Array<{ resourceId: string; quantity: number }>, fromLocation: string): ResourceDistribution;
  trackDistribution(distributionId: string): ResourceDistribution | null;
  getAvailableQuantity(resourceId: string): number;
}

class InventoryServiceImpl implements InventoryService {
  private inventory: Map<string, ResourceInventory> = new Map();
  private allocations: Map<string, ResourceAllocation> = new Map();
  private distributions: Map<string, ResourceDistribution> = new Map();
  private resourceCounter = 0;
  private allocationCounter = 0;
  private distributionCounter = 0;

  constructor() {
    this.initializeSampleInventory();
  }

  private initializeSampleInventory() {
    const sampleResources: Omit<ResourceInventory, 'id'>[] = [
      {
        name: 'First Aid Kits',
        category: 'Medical',
        unit: 'box',
        currentQuantity: 50,
        minimumQuantity: 10,
        maximumQuantity: 100,
        location: 'Central Depot',
        lastRestocked: Date.now() - 86400000,
        reorderPoint: 20,
        supplier: 'MedSupply Co',
        cost: 45,
      },
      {
        name: 'Stretchers',
        category: 'Medical',
        unit: 'unit',
        currentQuantity: 15,
        minimumQuantity: 5,
        maximumQuantity: 30,
        location: 'Central Depot',
        lastRestocked: Date.now() - 604800000,
        reorderPoint: 8,
        supplier: 'Emergency Equipment Inc',
        cost: 320,
      },
      {
        name: 'Fire Extinguishers',
        category: 'Fire Safety',
        unit: 'unit',
        currentQuantity: 30,
        minimumQuantity: 10,
        maximumQuantity: 50,
        location: 'Station A',
        lastRestocked: Date.now() - 2592000000,
        reorderPoint: 15,
        supplier: 'Fire Safety Systems',
        cost: 150,
      },
      {
        name: 'Oxygen Tanks',
        category: 'Medical',
        unit: 'unit',
        currentQuantity: 20,
        minimumQuantity: 5,
        maximumQuantity: 40,
        location: 'Central Depot',
        lastRestocked: Date.now() - 172800000,
        reorderPoint: 10,
        supplier: 'Medical Gas Provider',
        cost: 200,
      },
      {
        name: 'Blankets',
        category: 'Relief',
        unit: 'piece',
        currentQuantity: 200,
        minimumQuantity: 50,
        maximumQuantity: 500,
        location: 'Relief Storage',
        lastRestocked: Date.now() - 86400000,
        reorderPoint: 100,
        supplier: 'General Supply',
        cost: 8,
      },
      {
        name: 'Water Bottles',
        category: 'Relief',
        unit: 'case',
        currentQuantity: 100,
        minimumQuantity: 20,
        maximumQuantity: 200,
        location: 'Relief Storage',
        lastRestocked: Date.now() - 259200000,
        reorderPoint: 50,
        supplier: 'Beverage Distributor',
        cost: 25,
      },
    ];

    sampleResources.forEach(r => this.addResource(r));
  }

  addResource(resource: Omit<ResourceInventory, 'id'>): ResourceInventory {
    const fullResource: ResourceInventory = {
      id: `res-${++this.resourceCounter}`,
      ...resource,
    };
    this.inventory.set(fullResource.id, fullResource);
    return fullResource;
  }

  getResource(id: string): ResourceInventory | null {
    return this.inventory.get(id) || null;
  }

  listResources(category?: string): ResourceInventory[] {
    const all = Array.from(this.inventory.values());
    if (!category) return all;
    return all.filter(r => r.category === category);
  }

  updateStock(resourceId: string, quantity: number): void {
    const resource = this.inventory.get(resourceId);
    if (resource) {
      resource.currentQuantity = quantity;
    }
  }

  allocateResource(incidentId: string, resourceId: string, quantity: number, allocatedBy: string): ResourceAllocation {
    const resource = this.inventory.get(resourceId);
    if (!resource || resource.currentQuantity < quantity) {
      throw new Error('Insufficient inventory');
    }

    const allocation: ResourceAllocation = {
      id: `alloc-${++this.allocationCounter}`,
      incidentId,
      resourceId,
      quantityAllocated: quantity,
      allocatedAt: Date.now(),
      allocatedBy,
      status: 'pending',
    };

    resource.currentQuantity -= quantity;
    this.allocations.set(allocation.id, allocation);
    return allocation;
  }

  deallocateResource(allocationId: string): boolean {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) return false;

    const resource = this.inventory.get(allocation.resourceId);
    if (resource) {
      resource.currentQuantity += allocation.quantityAllocated;
    }

    this.allocations.delete(allocationId);
    return true;
  }

  getIncidentAllocations(incidentId: string): ResourceAllocation[] {
    return Array.from(this.allocations.values()).filter(a => a.incidentId === incidentId);
  }

  getLowStockItems(): ResourceInventory[] {
    return Array.from(this.inventory.values()).filter(r => r.currentQuantity <= r.reorderPoint);
  }

  planDistribution(incidentId: string, resources: Array<{ resourceId: string; quantity: number }>, fromLocation: string): ResourceDistribution {
    const totalDistance = Math.random() * 50 + 5; // 5-55 km
    const distribution: ResourceDistribution = {
      id: `dist-${++this.distributionCounter}`,
      fromLocation,
      toIncidentId: incidentId,
      resources,
      distance: totalDistance,
      estimatedTimeMinutes: Math.ceil(totalDistance / 60 * 60), // Rough calculation
      startTime: Date.now(),
      status: 'planned',
    };

    this.distributions.set(distribution.id, distribution);
    return distribution;
  }

  trackDistribution(distributionId: string): ResourceDistribution | null {
    return this.distributions.get(distributionId) || null;
  }

  getAvailableQuantity(resourceId: string): number {
    const resource = this.inventory.get(resourceId);
    if (!resource) return 0;

    const allocated = Array.from(this.allocations.values())
      .filter(a => a.resourceId === resourceId && (a.status === 'pending' || a.status === 'delivered'))
      .reduce((sum, a) => sum + a.quantityAllocated, 0);

    return resource.currentQuantity - allocated;
  }
}

export const inventoryService = new InventoryServiceImpl();
