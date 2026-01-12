import React, { useState, useMemo } from 'react';
import { inventoryService, ResourceAllocation } from '../services/inventoryService';

interface ResourcePanelProps {
  incidentId: string;
  onRequestResource?: (resourceId: string, quantity: number) => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({
  incidentId,
  onRequestResource,
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'allocated'>('allocated');
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);

  const resources = inventoryService.listResources();
  const allocations = inventoryService.getIncidentAllocations(incidentId);
  const lowStockItems = inventoryService.getLowStockItems();

  const selectedResource = selectedResourceId ? inventoryService.getResource(selectedResourceId) : null;

  const handleRequestResource = (resourceId: string, quantity: number) => {
    try {
      inventoryService.allocateResource(incidentId, resourceId, quantity, 'system');
      setSelectedResourceId(null);
      setRequestQuantity(1);
      onRequestResource?.(resourceId, quantity);
    } catch (error) {
      console.error('Cannot allocate resource:', error);
      alert('Insufficient inventory for this resource');
    }
  };

  const getStockStatus = (available: number, minimum: number, maximum: number) => {
    const percentage = (available / maximum) * 100;
    if (available <= minimum) return { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critical' };
    if (available <= minimum * 1.5) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Low' };
    if (available >= maximum * 0.9) return { color: 'text-green-400', bg: 'bg-green-500/10', label: 'High' };
    return { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Normal' };
  };

  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-white mb-3">Resource Management</h3>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('allocated')}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'allocated'
                ? 'text-primary border-b-2 border-primary -mb-3'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Allocated ({allocations.length})
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'request'
                ? 'text-primary border-b-2 border-primary -mb-3'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Request
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'allocated' ? (
          // Allocated Resources
          <div className="p-4 space-y-3">
            {allocations.length === 0 ? (
              <div className="text-center py-6 text-white/40">
                <span className="material-symbols-outlined text-3xl mb-2 block">inventory_2</span>
                <p className="text-sm">No resources allocated yet</p>
              </div>
            ) : (
              allocations.map(allocation => {
                const resource = inventoryService.getResource(allocation.resourceId);
                return (
                  <div key={allocation.id} className="bg-slate-700/50 rounded-lg p-4 border border-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{resource?.name}</h4>
                        <p className="text-xs text-white/50 mt-1">{resource?.category}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          allocation.status === 'delivered'
                            ? 'bg-green-500/20 text-green-400'
                            : allocation.status === 'in-use'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {allocation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-white/70 mb-3">
                      <div>
                        <span className="text-white/50">Quantity:</span>
                        <p className="font-semibold text-white">
                          {allocation.quantityAllocated} {resource?.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/50">Allocated:</span>
                        <p className="font-semibold text-white">
                          {new Date(allocation.allocatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {allocation.notes && (
                      <p className="text-[10px] text-white/60 italic border-t border-white/10 pt-2 mt-2">
                        "{allocation.notes}"
                      </p>
                    )}

                    <button
                      onClick={() =>
                        inventoryService.deallocateResource(allocation.id)
                      }
                      className="mt-3 w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-semibold transition-all"
                    >
                      Return Resource
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Request Resources
          <div className="p-4 space-y-3">
            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-outlined text-yellow-400 text-lg flex-shrink-0 mt-0.5">
                    warning
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-yellow-400">Low Stock Alert</p>
                    <p className="text-[10px] text-yellow-300/80 mt-1">
                      {lowStockItems.length} item(s) below reorder point
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resources List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {resources.map(resource => {
                const available = inventoryService.getAvailableQuantity(resource.id);
                const status = getStockStatus(available, resource.minimumQuantity, resource.maximumQuantity);
                const isSelected = selectedResourceId === resource.id;

                return (
                  <button
                    key={resource.id}
                    onClick={() => setSelectedResourceId(isSelected ? null : resource.id)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-primary/20 border-primary'
                        : 'bg-slate-700/50 border-white/5 hover:border-white/10 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">{resource.name}</h4>
                        <p className="text-xs text-white/50 mt-0.5">{resource.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{available}</p>
                        <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
                      </div>
                    </div>

                    {/* Stock Bar */}
                    <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          available <= resource.minimumQuantity
                            ? 'bg-red-500'
                            : available <= resource.minimumQuantity * 1.5
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (available / resource.maximumQuantity) * 100)}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Request Form */}
            {selectedResource && (
              <div className="sticky bottom-0 bg-slate-700/80 backdrop-blur border-t border-white/10 p-4 space-y-3 mt-4">
                <div>
                  <p className="text-xs text-white/60 mb-2">Quantity to Request</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRequestQuantity(Math.max(1, requestQuantity - 1))}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-all text-sm font-semibold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={requestQuantity}
                      onChange={(e) => setRequestQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={inventoryService.getAvailableQuantity(selectedResource.id)}
                      className="flex-1 px-3 py-2 bg-slate-600 text-white rounded text-center font-semibold focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setRequestQuantity(
                          Math.min(
                            requestQuantity + 1,
                            inventoryService.getAvailableQuantity(selectedResource.id)
                          )
                        )
                      }
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-all text-sm font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestResource(selectedResource.id, requestQuantity)}
                  disabled={requestQuantity > inventoryService.getAvailableQuantity(selectedResource.id)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/80 hover:to-blue-500 disabled:from-primary/30 disabled:to-blue-600/30 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Allocate {requestQuantity} {selectedResource.unit}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcePanel;
