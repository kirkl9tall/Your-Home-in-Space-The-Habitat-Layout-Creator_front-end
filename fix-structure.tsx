// Let me just fix the main section structure that's broken

/* Replace the broken main section starting around line 1777 with: */

            {/* Main Canvas Area */}
            <main className="flex-1 relative bg-gradient-to-br from-purple-950/20 via-transparent to-blue-950/20">
              <ThreeScene 
                objects={objects}
                setObjects={setObjects}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                hoverPointRef={hoverPointRef}
                isInitialized={isInitialized}
                setIsInitialized={setIsInitialized}
                sceneRefs={sceneRefs}
                onContextMenu={(x, y, objectId) => {
                  setContextMenu({ visible: true, x, y, objectId });
                }}
              />

              {/* NASA Mission Info Overlay */}
              <div className="absolute top-6 right-6 glass-morphism rounded-xl p-4 shadow-2xl border border-blue-500/30 glow-blue">
                <div className="text-sm space-y-2">
                  <div className="font-medium text-blue-300 flex items-center gap-2 text-shadow">
                    <Settings className="w-4 h-4" />
                    {scenario.destination.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-300 space-y-1 text-shadow-sm">
                    <div>Crew: {scenario.crew_size} members</div>
                    <div>Duration: {scenario.mission_duration_days} days</div>
                    <div>Vehicle: {scenario.fairing.name}</div>
                    <div>Modules: {objects.length}</div>
                  </div>
                </div>
              </div>

              {/* Camera Controls Help */}
              {showCameraHelp && (
                <div className="absolute bottom-6 right-6 glass-morphism rounded-xl p-3 shadow-2xl border border-purple-500/30 glow-purple max-w-[220px]">
                  <div className="text-xs space-y-2">
                    <div className="font-medium text-purple-300 flex items-center justify-between text-shadow">
                      <div className="flex items-center gap-2">
                        <Camera className="w-3 h-3" />
                        Controls
                      </div>
                      <button 
                        onClick={() => setShowCameraHelp(false)}
                        className="text-gray-400 hover:text-white transition-colors text-xs"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="text-gray-300 text-shadow-sm space-y-1">
                      <div className="text-[10px] font-medium text-purple-200">Camera:</div>
                      <div className="text-[10px]">• <kbd className="bg-gray-800/50 px-1 rounded text-[9px]">Space</kbd> + Drag: Pan</div>
                      <div className="text-[10px]">• Mouse wheel: Zoom</div>
                    </div>
                    
                    <div className="text-gray-300 text-shadow-sm space-y-1">
                      <div className="text-[10px] font-medium text-yellow-200">Objects (when selected):</div>
                      <div className="text-[10px]">• Arrow keys: Move X/Z • W/S: Height</div>
                      <div className="text-[10px]">• Q/E: Rotate • R/F/T/G: Pitch/Roll</div>
                      <div className="text-[10px]">• Hold Shift: Faster movement</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedId && (
                <div className="absolute top-6 left-6 glass-morphism rounded-xl p-3 shadow-2xl border border-yellow-500/40 glow-orange max-w-[280px]">
                  <div className="flex items-center gap-2 text-yellow-300 font-medium mb-2 text-shadow text-xs">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                    Module Selected - Keyboard Controls
                  </div>
                  <div className="text-[10px] text-gray-300 space-y-1 text-shadow-sm">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">←→</kbd> Move X</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">↑↓</kbd> Move Z</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">W/S</kbd> Height</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Q/E</kbd> Rotate Y</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">R/F</kbd> Pitch</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">T/G</kbd> Roll</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Ctrl+±</kbd> Scale</div>
                      <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Shift</kbd> Fast</div>
                    </div>
                    <div className="text-[9px] text-gray-400 mt-2 border-t border-gray-600/50 pt-1">
                      Ctrl+X: Reset rotation • Ctrl+C: Reset scale
                    </div>
                  </div>
                </div>
              )}

              {/* Keyboard Action Feedback */}
              {keyboardAction && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-sm border border-green-500/50 rounded-lg px-4 py-2 shadow-2xl animate-pulse">
                  <div className="flex items-center gap-2 text-green-300 font-medium text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    {keyboardAction}
                  </div>
                </div>
              )}
            </main>