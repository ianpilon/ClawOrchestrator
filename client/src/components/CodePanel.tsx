import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeData, CodeChange, statusColors } from '@/lib/mockData';
import { 
  X, ChevronRight, ChevronDown, File, Folder, FolderOpen, 
  Bot, Check, XCircle, Clock, GitBranch, FileCode, Plus, Minus, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NodeData[];
  onNodeSelect: (node: NodeData) => void;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  agents?: { id: string; name: string; status: string; changeType: 'add' | 'modify' | 'delete' }[];
}

function buildFileTree(nodes: NodeData[]): FileTreeNode[] {
  const fileMap = new Map<string, { agents: { id: string; name: string; status: string; changeType: 'add' | 'modify' | 'delete' }[] }>();
  
  nodes.forEach(node => {
    if (node.currentFile && node.agentStatus === 'active') {
      const existing = fileMap.get(node.currentFile) || { agents: [] };
      existing.agents.push({
        id: node.id,
        name: node.name,
        status: node.agentStatus,
        changeType: 'modify',
      });
      fileMap.set(node.currentFile, existing);
    }
    
    node.codeChanges.forEach(change => {
      if (change.status === 'pending') {
        const existing = fileMap.get(change.filePath) || { agents: [] };
        if (!existing.agents.find(a => a.id === node.id)) {
          existing.agents.push({
            id: node.id,
            name: node.name,
            status: node.agentStatus,
            changeType: change.oldCode.length < change.newCode.length ? 'add' : 'modify',
          });
        }
        fileMap.set(change.filePath, existing);
      }
    });
  });

  const tree: FileTreeNode[] = [];
  const folderMap = new Map<string, FileTreeNode>();

  fileMap.forEach((data, filePath) => {
    const parts = filePath.split('/');
    let currentPath = '';
    let currentLevel = tree;

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      if (isFile) {
        currentLevel.push({
          name: part,
          path: filePath,
          type: 'file',
          agents: data.agents,
        });
      } else {
        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    });
  });

  return tree;
}

function FileTreeItem({ 
  node, 
  depth, 
  onSelect,
  selectedPath,
}: { 
  node: FileTreeNode; 
  depth: number; 
  onSelect: (path: string) => void;
  selectedPath: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = node.path === selectedPath;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-white/5 transition-colors text-left"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="text-xs font-mono text-foreground">{node.name}</span>
        </button>
        {isExpanded && node.children?.map((child, i) => (
          <FileTreeItem 
            key={child.path} 
            node={child} 
            depth={depth + 1} 
            onSelect={onSelect}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-1.5 py-1 px-2 transition-colors text-left ${
        isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      data-testid={`file-${node.path}`}
    >
      <FileCode className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-xs font-mono text-foreground flex-1 truncate">{node.name}</span>
      {node.agents && node.agents.length > 0 && (
        <div className="flex items-center gap-1">
          {node.agents.slice(0, 2).map(agent => (
            <div 
              key={agent.id}
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: statusColors[agent.status as keyof typeof statusColors] + '30' }}
              title={agent.name}
            >
              <Bot className="w-2.5 h-2.5" style={{ color: statusColors[agent.status as keyof typeof statusColors] }} />
            </div>
          ))}
          {node.agents.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{node.agents.length - 2}</span>
          )}
        </div>
      )}
    </button>
  );
}

function DiffViewer({ change, onApprove, onReject }: { 
  change: CodeChange; 
  onApprove: () => void;
  onReject: () => void;
}) {
  const oldLines = change.oldCode.split('\n');
  const newLines = change.newCode.split('\n');

  return (
    <div className="border border-white/5 bg-[#0d0f12]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-foreground">{change.filePath}</span>
          <Badge 
            variant="outline" 
            className={`rounded-none text-[8px] ${
              change.status === 'pending' 
                ? 'border-amber-500/30 text-amber-500' 
                : change.status === 'approved'
                ? 'border-emerald-500/30 text-emerald-500'
                : 'border-red-500/30 text-red-500'
            }`}
          >
            {change.status.toUpperCase()}
          </Badge>
        </div>
        {change.status === 'pending' && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onApprove}
              className="h-6 w-6 hover:bg-emerald-500/10 text-emerald-500 rounded-none"
              data-testid="approve-change"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onReject}
              className="h-6 w-6 hover:bg-red-500/10 text-red-500 rounded-none"
              data-testid="reject-change"
            >
              <XCircle className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-2 overflow-x-auto">
        <div className="font-mono text-[11px] leading-relaxed">
          <div className="text-muted-foreground/60 mb-2 text-[10px]">
            Lines {change.lineStart}-{change.lineEnd} • {change.timestamp}
          </div>
          
          <div className="space-y-0.5">
            {oldLines.map((line, i) => (
              <div key={`old-${i}`} className="flex">
                <span className="w-6 text-right pr-2 text-red-400/50 select-none">{change.lineStart + i}</span>
                <span className="px-1 bg-red-500/10 text-red-400 flex-1">
                  <Minus className="w-3 h-3 inline mr-1" />
                  {line}
                </span>
              </div>
            ))}
            {newLines.map((line, i) => (
              <div key={`new-${i}`} className="flex">
                <span className="w-6 text-right pr-2 text-emerald-400/50 select-none">{change.lineStart + oldLines.length + i}</span>
                <span className="px-1 bg-emerald-500/10 text-emerald-400 flex-1">
                  <Plus className="w-3 h-3 inline mr-1" />
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CodePanel({ isOpen, onClose, nodes, onNodeSelect }: CodePanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'changes'>('files');

  const fileTree = useMemo(() => buildFileTree(nodes), [nodes]);
  
  const allPendingChanges = useMemo(() => {
    return nodes.flatMap(node => 
      node.codeChanges
        .filter(c => c.status === 'pending')
        .map(c => ({ ...c, agentName: node.name, agentId: node.id }))
    );
  }, [nodes]);

  const selectedFileChanges = useMemo(() => {
    if (!selectedFile) return [];
    return nodes.flatMap(node => 
      node.codeChanges
        .filter(c => c.filePath === selectedFile)
        .map(c => ({ ...c, agentName: node.name, agentId: node.id }))
    );
  }, [nodes, selectedFile]);

  const activeAgents = useMemo(() => {
    return nodes.filter(n => n.currentFile && n.agentStatus === 'active');
  }, [nodes]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }}
      className="fixed left-0 top-0 bottom-0 right-[120px] z-40 pointer-events-auto"
      data-testid="code-panel"
    >
      <div className="h-full bg-[#1a1c23]/95 backdrop-blur-xl border border-white/10 text-foreground shadow-2xl overflow-hidden flex flex-col relative">
        {/* Tactical Corner Markers */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50 z-10" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50 z-10" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50 z-10" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50 z-10" />

        {/* Header */}
        <div className="p-3 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-foreground">Code Panel</span>
              <Badge variant="outline" className="rounded-none text-[8px] border-primary/30 text-primary">
                {allPendingChanges.length} PENDING
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 hover:bg-white/5 text-muted-foreground hover:text-foreground rounded-none"
              data-testid="close-code-panel"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'files' 
                ? 'text-primary border-b border-primary bg-white/[0.02]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Folder className="w-3 h-3 inline mr-1.5" />
            File Tree
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'changes' 
                ? 'text-primary border-b border-primary bg-white/[0.02]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className="w-3 h-3 inline mr-1.5" />
            Pending Changes ({allPendingChanges.length})
          </button>
        </div>

        {/* Active Agents Bar */}
        {activeAgents.length > 0 && (
          <div className="px-3 py-2 border-b border-white/5 bg-white/[0.01]">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
              Active Agents
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeAgents.slice(0, 6).map(agent => (
                <button
                  key={agent.id}
                  onClick={() => onNodeSelect(agent)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  data-testid={`active-agent-${agent.id}`}
                >
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-400">{agent.name.split(' ')[0]}</span>
                </button>
              ))}
              {activeAgents.length > 6 && (
                <span className="text-[10px] text-muted-foreground self-center">+{activeAgents.length - 6} more</span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'files' ? (
            <>
              {/* File Tree */}
              <div className="w-48 border-r border-white/5 overflow-y-auto">
                {fileTree.length > 0 ? (
                  fileTree.map(node => (
                    <FileTreeItem 
                      key={node.path} 
                      node={node} 
                      depth={0} 
                      onSelect={setSelectedFile}
                      selectedPath={selectedFile}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    No active files
                  </div>
                )}
              </div>

              {/* File Changes */}
              <div className="flex-1 overflow-y-auto p-3">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      Changes to {selectedFile}
                    </div>
                    {selectedFileChanges.length > 0 ? (
                      selectedFileChanges.map(change => (
                        <div key={change.id}>
                          <div className="text-[10px] font-mono text-muted-foreground mb-1">
                            <Bot className="w-3 h-3 inline mr-1" />
                            {change.agentName}
                          </div>
                          <DiffViewer 
                            change={change} 
                            onApprove={() => {}} 
                            onReject={() => {}}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No pending changes</div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    Select a file to view changes
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {allPendingChanges.length > 0 ? (
                allPendingChanges.map(change => (
                  <div key={change.id}>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1">
                      <Bot className="w-3 h-3" />
                      <span>{change.agentName}</span>
                      <span className="text-primary/50">•</span>
                      <span>{change.filePath}</span>
                    </div>
                    <DiffViewer 
                      change={change} 
                      onApprove={() => {}} 
                      onReject={() => {}}
                    />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  No pending changes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
