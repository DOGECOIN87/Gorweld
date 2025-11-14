
import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PresentationControls, Text3D, Center, Float, useProgress, Environment, ContactShadows, Instances, Instance } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- ICONS (used in HTML overlays) ---
const XIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>;
const TelegramIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 0l-6 22-8.129-7.239 7.879-8.239-10.535 6.954-8.215-2.476 24-11z"/></svg>;

// --- HTML OVERLAY ---
const InfoOverlay = ({ onClose }) => (
    <div className="overlay-backdrop">
        <div className="overlay-content">
            <button onClick={onClose} className="overlay-close-btn">&times;</button>
            <div className="overlay-grid">
                <div className="overlay-section">
                    <h3 className="overlay-title">Manifesto</h3>
                    <p>No roadmaps, only welds. Built by welders, not VCs. On-chain data only. This is an experimental memecoin. Tokens can go to zero. Always do your own research.</p>
                </div>
                <div className="overlay-section">
                    <h3 className="overlay-title">Tokenomics</h3>
                    <p><strong>Ticker:</strong> $GORWELD on SOL</p>
                    <p><strong>Total Supply:</strong> 1,000,000,000</p>
                    <p><strong>Tax:</strong> 0% Buy / 0% Sell</p>
                </div>
                <div className="overlay-section full-span">
                    <h3 className="overlay-title">Links</h3>
                    <div className="overlay-links">
                        <a href="https://pump.fun/coin/A8cDgfn1tAQbsZfD8oZU5u2xZZqKtJTmq7m9E3PLNMqr" target="_blank" rel="noopener noreferrer">Buy on Pump.fun</a>
                        <a href="https://x.com/PrzemSas/media" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
                        <a href="https://t.me/+E635Vdn-6k1iMDE0" target="_blank" rel="noopener noreferrer">Telegram</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


// --- 3D COMPONENTS ---
const fontUrl = "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json";

const WeldingSparks = React.forwardRef((props, ref) => {
    const sparksContainerRef = useRef<THREE.Group>(null!);

    useFrame(() => {
        if (sparksContainerRef.current && sparksContainerRef.current.visible) {
            sparksContainerRef.current.children.forEach((spark: any) => {
                spark.position.y -= 0.08;
                spark.material.opacity = Math.max(0, spark.material.opacity - 0.015);
                spark.rotation.x += Math.random() * 0.2;
                spark.rotation.y += Math.random() * 0.2;
                if (spark.position.y < -0.5) {
                    spark.position.y = 0;
                    spark.position.x = (Math.random() - 0.5) * 0.3;
                    spark.position.z = (Math.random() - 0.5) * 0.3;
                    spark.material.opacity = 1;
                }
            });
        }
    });

    const sparks = Array.from({ length: 80 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 0.3, Math.random() * 0.6, (Math.random() - 0.5) * 0.3]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#ffaa33" : "#ff6633"} transparent opacity={1} />
        </mesh>
    ));

    return <group ref={ref as React.Ref<THREE.Group>}><group ref={sparksContainerRef}>{sparks}</group></group>;
});


const WeldingTable = (props) => (
    <group {...props}>
        {/* Tabletop */}
        <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.1, 1.5]} />
            <meshStandardMaterial color="#444" metalness={0.9} roughness={0.5} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.65, -1.2, 0.65]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.6}/>
        </mesh>
         <mesh position={[0.65, -1.2, 0.65]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.6}/>
        </mesh>
         <mesh position={[-0.65, -1.2, -0.65]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.6}/>
        </mesh>
         <mesh position={[0.65, -1.2, -0.65]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.6}/>
        </mesh>
    </group>
);

const GasCylinder = (props) => (
    <mesh {...props} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.35, 3.2, 20]} />
        <meshStandardMaterial color="#0b2c2b" roughness={0.5} metalness={0.7} />
    </mesh>
);


const WelderCharacter = ({ armRef, lightRef, sparksRef, ...props }) => {
    const [hovered, setHovered] = useState(false);
    useEffect(() => { document.body.style.cursor = hovered ? 'pointer' : 'auto'; }, [hovered]);

    return (
        <group 
            {...props}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        >
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                {/* Body */}
                <mesh position={[0, -0.4, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.8, 0.5]} />
                    <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
                </mesh>
                
                <group position={[0, 0.2, 0]}>
                    {/* Head/Mask */}
                    <mesh castShadow>
                        <boxGeometry args={[0.7, 0.5, 0.6]} />
                        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
                    </mesh>
                    {/* Goggle Frame */}
                    <mesh position={[0, 0, 0.28]} castShadow>
                        <boxGeometry args={[0.6, 0.28, 0.08]} />
                        <meshStandardMaterial color="#101316" roughness={0.4} metalness={0.7} />
                    </mesh>
                     {/* Visor */}
                    <mesh position={[0, 0, 0.325]}>
                        <planeGeometry args={[0.5, 0.2]} />
                        <meshStandardMaterial 
                            color={hovered ? "#33ff99" : "#1a6644"} 
                            emissive={hovered ? "#33ff99" : "#1a6644"} 
                            emissiveIntensity={hovered ? 5 : 3} 
                            toneMapped={false}
                        />
                    </mesh>
                </group>

                 {/* Arm holding tool */}
                <group ref={armRef} position={[0.2, -0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
                    <mesh position={[0.3, 0, 0]} castShadow>
                        <boxGeometry args={[0.7, 0.2, 0.2]} />
                        <meshStandardMaterial color="#555" roughness={0.5} metalness={0.9} />
                    </mesh>
                    {/* Welding Tool */}
                    <mesh position={[0.7, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
                        <cylinderGeometry args={[0.06, 0.06, 0.6, 16]} />
                        <meshStandardMaterial color="#666" roughness={0.4} metalness={0.95} />
                    </mesh>
                    {/* Welding Tip Glow */}
                    <mesh position={[0.9, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="#ffaa33" emissive="#ff8800" />
                    </mesh>
                    
                    <pointLight ref={lightRef} position={[0.9, 0, 0]} color="#ffaa33" intensity={0} distance={5} decay={2} />\n                    <WeldingSparks ref={sparksRef} position={[0.9, 0, 0]} />
                </group>

            </Float>
        </group>
    );
};

const ContractSign = ({ onCopy, copyText }) => {
    const [hovered, setHovered] = useState(false);
    useEffect(() => {
        document.body.style.cursor = hovered ? 'pointer' : 'auto';
    }, [hovered]);

    return (
        <group 
            position={[-1.5, 1.5, -1]} 
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
        >
            <Float speed={1} rotationIntensity={0.5} floatIntensity={0.2}>
                {/* Simple plane sign used as a fallback instead of Text3D to avoid suspending */}
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[1.2, 0.6]} />
                    <meshStandardMaterial color={hovered ? '#33ff99' : '#33cc88'} emissive={hovered ? '#33ff99' : '#33cc88'} metalness={0.6} roughness={0.2} />
                </mesh>
            </Float>
        </group>
    );
};

const AnimatedWelderScene = ({ onClick, onCopy, copyText }) => {
    const armRef = useRef<THREE.Group>(null!);
    const lightRef = useRef<THREE.PointLight>(null!);
    const sparksRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!armRef.current || !lightRef.current || !sparksRef.current) return;
        
        const t = state.clock.getElapsedTime();
        
        // Arm animation
        const angle = Math.sin(t * 2.5) * 0.4;
        armRef.current.rotation.z = -Math.PI / 6 + angle;
        
        // Sparks & light animation
        const weldFactor = Math.max(0, Math.sin(t * 2.5) - 0.7) / 0.3; // from 0 to 1
        lightRef.current.intensity = weldFactor * 50;
        sparksRef.current.visible = weldFactor > 0.1;
    });

    return (
        <group>
            <WelderCharacter 
                onClick={onClick} 
                armRef={armRef}
                lightRef={lightRef}
                sparksRef={sparksRef}
            />
            <WeldingTable />
            <GasCylinder position={[-1.5, -1.5 + 3.2/2, 0.5]} />
            <ContractSign onCopy={onCopy} copyText={copyText} />
        </group>
    );
};


// --- Landfill/Junk Components ---
const JunkPiles = () => {
    const count = 2000;

    const mounds = useMemo(() => [
        { center: new THREE.Vector2(-8, 5), height: 4, radius: 8 },
        { center: new THREE.Vector2(10, -10), height: 5, radius: 10 },
        { center: new THREE.Vector2(5, 12), height: 3, radius: 6 },
        { center: new THREE.Vector2(-12, -8), height: 3.5, radius: 7 },
        { center: new THREE.Vector2(0, 0), height: 1.5, radius: 12 },
    ], []);

    const junkData = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            const mound = mounds[Math.floor(Math.random() * mounds.length)];
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * mound.radius;
            const x = mound.center.x + Math.cos(angle) * dist;
            const z = mound.center.y + Math.sin(angle) * dist;
            
            const d = Math.sqrt(Math.pow(x - mound.center.x, 2) + Math.pow(z - mound.center.y, 2));
            const moundY = mound.height * Math.cos((d / mound.radius) * (Math.PI / 2));
            const y = -1.5 + moundY + (Math.random() - 0.5) * 0.2;

            const scale = 0.5 + Math.random() * 1.5;

            data.push({
                position: [x, y, z] as [number, number, number],
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
                scale: scale,
            });
        }
        return data;
    }, [count, mounds]);

    return (
        <group>
            <Instances limit={count / 2} castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.5} />
                {junkData.slice(0, count / 2).map((props, i) => (
                    <Instance key={i} {...props} />
                ))}
            </Instances>
            <Instances limit={count / 4} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.3, 2.5, 8]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.8} />
                {junkData.slice(count / 2, count / 2 + count / 4).map((props, i) => (
                    <Instance key={i} {...props} />
                ))}
            </Instances>
            <Instances limit={count / 4} castShadow receiveShadow>
                <boxGeometry args={[2.5, 0.1, 1.5]} />
                <meshStandardMaterial color="#444" roughness={0.9} metalness={0.2} />
                {junkData.slice(count / 2 + count / 4).map((props, i) => (
                    <Instance key={i} {...props} />
                ))}
            </Instances>
        </group>
    );
};


const DeformedGround = () => {
    const geo = useMemo(() => {
        const size = 120;
        const segments = 100;
        const g = new THREE.PlaneGeometry(size, size, segments, segments);
        const pos = g.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const r = Math.sqrt(x*x + y*y);
            const base = Math.max(0, 10 - r * 0.25);
            const noise = (Math.sin(x*0.2) + Math.cos(y*0.25)) * 0.7;
            const small = (Math.sin(x*1.1) * Math.cos(y*1.5)) * 0.5;
            const h = base + noise + small + Math.random() * 0.3;
            pos.setZ(i, h * 0.5);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        return g;
    }, []);

    return (
        <mesh 
            geometry={geo}
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -1.5, 0]}
            receiveShadow
        >
            <meshStandardMaterial color="#1a120d" roughness={0.95} metalness={0.15} />
        </mesh>
    );
};

const DustParticles = ({ count = 400 }) => {
    const pointsRef = useRef<THREE.Points>(null!);

    const particles = useMemo(() => {
        const data = [];
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 14 + 2;
            const z = (Math.random() - 0.5) * 40;
            positions.set([x, y, z], i * 3);
            data.push({
                velocity: (0.05 + Math.random() * 0.15),
            });
        }
        return { data, positions };
    }, [count]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
            const d = particles.data[i];
            let y = positions[i * 3 + 1];
            y += d.velocity * delta * 10;

            if (y > 18) {
                y = 2 + Math.random() * 4;
            }
            positions[i * 3 + 1] = y;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial color="#ffaa88" size={0.15} transparent opacity={0.8} depthWrite={false} sizeAttenuation={true} />
        </points>
    );
};


function CustomLoader() {
  const { active } = useProgress();
  const loaderElement = document.querySelector<HTMLElement>('.loader');
  
  useEffect(() => {
    if (loaderElement) {
        loaderElement.style.display = active ? 'flex' : 'none';
    }
  }, [active, loaderElement]);

  return null;
}

// --- Main App Component ---
const App = () => {
    const contractAddress = 'A8cDgfn1tAQbsZfD8oZU5u2xZZqKtJTmq7m9E3PLNMqr';
    const [copyText, setCopyText] = useState('Click to Copy');
    const [showOverlay, setShowOverlay] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(contractAddress).then(() => {
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Click to Copy'), 2000);
        });
    }, [contractAddress]);

    useEffect(() => {
        // update the dev badge so we can tell whether the React app mounted correctly
        try {
            const badge = document.querySelector('.dev-badge');
            if (badge) badge.textContent = 'App mounted';
        } catch (e) {
            // ignore
        }
    }, []);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-10 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="font-bold text-lg tracking-wider">GORWELD</div>
                     <div className="flex items-center gap-2 sm:gap-4">
                        <a href="https://x.com/PrzemSas/media" target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--text-soft)] hover:text-white transition-colors"><XIcon /></a>
                        <a href="https://t.me/+E635Vdn-6k1iMDE0" target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--text-soft)] hover:text-white transition-colors"><TelegramIcon /></a>
                        <a href="https://pump.fun/coin/A8cDgfn1tAQbsZfD8oZU5u2xZZqKtJTmq7m9E3PLNMqr" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-xs font-bold px-4 py-2 rounded-full border border-[var(--border-subtle)] hover:border-white transition-colors bg-[var(--bg)]/50 backdrop-blur-sm">
                            Buy on Pump.fun
                        </a>
                    </div>
                </div>
            </header>

            <Canvas camera={{ position: [0, 8, 20], fov: 50 }} shadows>
                <ambientLight intensity={0.6} />
                <fog attach="fog" args={['#050608', 12, 50]} />
                <pointLight position={[-5, 5, 5]} intensity={0.8} color="#ffaa33" distance={20} />
                <pointLight position={[5, 5, -5]} intensity={0.6} color="#33ccff" distance={20} />
                <Suspense fallback={null}>
                    <Environment preset="sunset" intensity={0.4} />
                    <directionalLight 
                        position={[10, 15, 5]} 
                        intensity={2.5}
                        castShadow 
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <directionalLight 
                        position={[-10, 8, -8]} 
                        intensity={0.8}
                        color="#33ccff"
                        castShadow
                    />
                    
                    <PresentationControls 
                        global 
                        snap={{ mass: 4, tension: 400 }} 
                        polar={[-0.4, 0.4]} 
                        azimuth={[-Math.PI / 4, Math.PI / 4]}
                    >
                        <AnimatedWelderScene 
                            onClick={() => setShowOverlay(true)} 
                            onCopy={handleCopy} 
                            copyText={copyText} 
                        />
                    </PresentationControls>
                    
                    <JunkPiles />
                    <ContactShadows position={[0, -1.45, 0]} opacity={0.75} scale={40} blur={2.5} far={10} />
                    <DeformedGround />
                    <DustParticles />

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.5} intensity={2} mipmapBlur luminanceSmoothing={0.5} />
                    </EffectComposer>
                </Suspense>
                {/* Debug marker: bright box in front of camera to confirm rendering */}
                <mesh position={[0, 0.5, 8]}> 
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshStandardMaterial color="#ff44aa" emissive="#ff66bb" metalness={0.5} roughness={0.2} />
                </mesh>
            </Canvas>
            <CustomLoader />
            {showOverlay && <InfoOverlay onClose={() => setShowOverlay(false)} />}
             <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 text-center text-xs text-[var(--text-soft)] tracking-widest pointer-events-none">
                CLICK & DRAG TO EXPLORE
            </footer>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);