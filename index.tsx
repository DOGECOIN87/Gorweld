import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Network configuration used throughout the UI for onboarding and links.
type NetworkConfig = {
    networkName: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    faucetUrl: string;
    nftContract: string;
    fundingWallet: string;
};

const gorbaganaConfig: NetworkConfig = {
    networkName: 'Gorbagana Testnet',
    chainId: 19011,
    rpcUrl: 'https://rpc.gorbagana.wtf',
    explorerUrl: 'https://scan.testnet.gorbagana.org',
    faucetUrl: 'https://faucet.gorbagana.org',
    nftContract: '0xa8E205Bba819F5f149048393c5AA3afc39B1CDC1',
    fundingWallet: '0x7Bb4de61a63fDB142A0B305d5eCdbeDB9342D0D4',
};

// many components use `config` as a variable name; provide an alias
const config = gorbaganaConfig;

        </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-white/90 rounded shadow">Chain ID: <strong>{config.chainId}</strong></div>
      <div className="p-4 bg-white/90 rounded shadow">RPC Node: <strong>{stripProtocol(config.rpcUrl)}</strong></div>
      <div className="p-4 bg-white/90 rounded shadow">Contract: <strong>{formatAddress(config.nftContract)}</strong></div>
    </section>
  </main>
);

const App: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [contractCopyText, setContractCopyText] = useState('Click to Copy');
  const [fundingCopyText, setFundingCopyText] = useState('Copy Funding Wallet');

  const handleCopyContract = useCallback(() => {
    navigator.clipboard.writeText(gorbaganaConfig.nftContract).then(() => {
      setContractCopyText('Copied!');
      setTimeout(() => setContractCopyText('Click to Copy'), 2000);
    });
  }, []);

  const handleCopyFunding = useCallback(() => {
    navigator.clipboard.writeText(gorbaganaConfig.fundingWallet).then(() => {
      setFundingCopyText('Wallet Copied!');
      setTimeout(() => setFundingCopyText('Copy Funding Wallet'), 2000);
    });
  }, []);

  useEffect(() => {
    try {
      const badge = document.querySelector('.dev-badge');
      if (badge) badge.textContent = 'Site mounted';
    } catch {}

                    <p><strong>Chain ID:</strong> {config.chainId}</p>
                    <p><strong>Primary Contract:</strong> {formatAddress(config.nftContract)}</p>
                </div>
                <div className="overlay-section">
                    <h3 className="overlay-title">Node Specs</h3>
                    <p><strong>RPC:</strong> {config.rpcUrl}</p>
                    <p><strong>Explorer:</strong> {config.explorerUrl}</p>
                    <p><strong>Faucet:</strong> {config.faucetUrl}</p>
                </div>
                <div className="overlay-section full-span">
                    <h3 className="overlay-title">Links</h3>
                    <div className="overlay-links">
                        <a href={config.explorerUrl} target="_blank" rel="noopener noreferrer">Open Explorer</a>
                        <a href={config.faucetUrl} target="_blank" rel="noopener noreferrer">Request Test GOR</a>
                        <a href="https://docs.gorbagana.wtf/" target="_blank" rel="noopener noreferrer">Docs</a>
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
                    
                    <pointLight ref={lightRef} position={[0.9, 0, 0]} color="#ffaa33" intensity={0} distance={5} decay={2} />
                    <WeldingSparks ref={sparksRef} position={[0.9, 0, 0]} />
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
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[1.2, 0.6]} />
                    <meshStandardMaterial color={hovered ? '#33ff99' : '#33cc88'} emissive={hovered ? '#33ff99' : '#33cc88'} metalness={0.6} roughness={0.2} />
                </mesh>
                <Center position={[0, 0, 0.05]}>
                    <Text3D font={fontUrl} size={0.15} height={0.02} curveSegments={6} bevelEnabled bevelThickness={0.005} bevelSize={0.003}>
                        {copyText.toUpperCase()}
                        <meshStandardMaterial color={hovered ? '#050c08' : '#0b1d16'} emissive="#33ffcc" emissiveIntensity={hovered ? 1.2 : 0.6} toneMapped={false} />
                    </Text3D>
                </Center>
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
const PatrolDrone = ({ radius, speed, offset, height, color }: { radius: number; speed: number; offset: number; height: number; color: string }) => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        const x = Math.cos(t * speed + offset) * radius;
        const z = Math.sin(t * speed + offset) * radius;
        const y = height + Math.sin(t * speed * 2 + offset) * 1.2;
        groupRef.current.position.set(x, y, z);
        groupRef.current.rotation.y = t * speed * 3;
    });

    return (
        <group ref={groupRef}>
            <mesh castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#111622" emissive={color} emissiveIntensity={1.6} metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.55, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.35} />
            </mesh>
            <pointLight color={color} intensity={2.5} distance={8} decay={2} />
        </group>
    );
};

const PatrolDrones = () => (
    <group>
        <PatrolDrone radius={8} speed={0.2} offset={0} height={4} color="#33ccff" />
        <PatrolDrone radius={10} speed={0.17} offset={Math.PI / 3} height={5.2} color="#33ffcc" />
        <PatrolDrone radius={12} speed={0.14} offset={Math.PI * 1.2} height={3.5} color="#ffaa88" />
    </group>
);

const ScrapCrane = () => {
    const boomRef = useRef<THREE.Group>(null!);
    const magnetRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (boomRef.current) {
            boomRef.current.rotation.y = Math.sin(t * 0.25) * 0.6 - 0.2;
        }
        if (magnetRef.current) {
            magnetRef.current.position.y = -1.5 - Math.sin(t * 1.4) * 0.4;
            magnetRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
        }
    });

    return (
        <group position={[-7, -1.5, -5]}>
            <mesh position={[0, 2.5, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.6, 5, 12]} />
                <meshStandardMaterial color="#1c1c1c" metalness={0.8} roughness={0.5} />
            </mesh>
            <mesh position={[0, 5, 0]} castShadow>
                <boxGeometry args={[1.2, 0.4, 1.2]} />
                <meshStandardMaterial color="#20252b" metalness={0.7} roughness={0.4} />
            </mesh>
            <group ref={boomRef} position={[0, 5.2, 0]}>
                <mesh position={[3.5, 0, 0]} castShadow>
                    <boxGeometry args={[7, 0.35, 0.4]} />
                    <meshStandardMaterial color="#2f343c" metalness={0.7} roughness={0.35} />
                </mesh>
                <group ref={magnetRef} position={[3.8, -1.5, 0]}>
                    <mesh position={[0, -0.8, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 1.6, 12]} />
                        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
                    </mesh>
                    <mesh position={[0, -1.8, 0]} castShadow>
                        <cylinderGeometry args={[0.8, 0.9, 0.4, 24]} />
                        <meshStandardMaterial color="#24292e" metalness={0.7} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, -2.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.9, 1.1, 32]} />
                        <meshBasicMaterial color="#33ffcc" transparent opacity={0.45} />
                    </mesh>
                    <mesh position={[0, -2.9, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                        <boxGeometry args={[1.6, 0.3, 1]} />
                        <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.8} />
                    </mesh>
                    <pointLight color="#33ffcc" intensity={2.2} distance={6} decay={2} />
                </group>
            </group>
        </group>
    );
};

const GorbaganaBeacon = () => {
    const pulseRef = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (!pulseRef.current) return;
        const t = state.clock.getElapsedTime();
        const scale = 1 + Math.sin(t * 2.2) * 0.15;
        pulseRef.current.scale.set(scale, 1, scale);
        const material = pulseRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 0.3 + (Math.sin(t * 2.2) + 1) * 0.25;
    });

    return (
        <group position={[4, -1.5, -4]}>
            <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.6, 2.8, 24]} />
                <meshStandardMaterial color="#181d22" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 2.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.7, 32]} />
                <meshBasicMaterial color="#33ffcc" transparent opacity={0.7} />
            </mesh>
            <mesh ref={pulseRef} position={[0, 2.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.3, 64]} />
                <meshBasicMaterial color="#33ffcc" transparent opacity={0.4} />
            </mesh>
            <Center position={[0, 3.4, 0]}>
                <Text3D font={fontUrl} size={0.25} height={0.03} bevelEnabled bevelThickness={0.01} bevelSize={0.005}>
                    GORBAGANA
                    <meshStandardMaterial color="#09110d" emissive="#33ff99" emissiveIntensity={1.3} toneMapped={false} />
                </Text3D>
            </Center>
            <Center position={[0, 3.05, 0]}>
                <Text3D font={fontUrl} size={0.12} height={0.02}>
                    TESTNET READY
                    <meshStandardMaterial color="#0a1510" emissive="#33ccff" emissiveIntensity={1.1} toneMapped={false} />
                </Text3D>
            </Center>
        </group>
    );
};

const ToxicBarrels = () => {
    const barrels = useMemo(() => {
        return Array.from({ length: 32 }).map(() => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 4 + Math.random() * 6;
            return {
                position: [Math.cos(angle) * radius, -1.1 + Math.random() * 0.2, Math.sin(angle) * radius] as [number, number, number],
                rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
                scale: 0.7 + Math.random() * 0.3,
            };
        });
    }, []);

    return (
        <Instances limit={barrels.length} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.9, 16]} />
            <meshStandardMaterial color="#2c261c" roughness={0.6} metalness={0.4} emissive="#1aff9c" emissiveIntensity={0.4} />
            {barrels.map((props, i) => (
                <Instance key={i} {...props} />
            ))}
        </Instances>
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

const NetworkPanel = ({
    config,
    contractCopyText,
    onCopyContract,
    fundingCopyText,
    onCopyFunding,
}: {
    config: NetworkConfig;
    contractCopyText: string;
    onCopyContract: () => void;
    fundingCopyText: string;
    onCopyFunding: () => void;
}) => (
    <div className="fixed bottom-6 left-6 z-10 w-72 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/80 backdrop-blur-xl shadow-2xl space-y-3">
        <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--accent)] mb-1">{config.networkName}</p>
            <p className="text-xs text-[var(--text-soft)]">Chain ID {config.chainId}</p>
        </div>
        <div className="text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-soft)]">RPC</span>
                <a href={config.rpcUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-main)] hover:text-[var(--accent)] transition-colors">{stripProtocol(config.rpcUrl)}</a>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-soft)]">Explorer</span>
                <a href={config.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-main)] hover:text-[var(--accent)] transition-colors">{stripProtocol(config.explorerUrl)}</a>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-soft)]">Faucet</span>
                <a href={config.faucetUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-main)] hover:text-[var(--accent)] transition-colors">{stripProtocol(config.faucetUrl)}</a>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-soft)]">NFT</span>
                <span className="font-semibold tracking-wider">{formatAddress(config.nftContract)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-soft)]">Treasury</span>
                <span className="font-semibold tracking-wider">{formatAddress(config.fundingWallet)}</span>
            </div>
        </div>
        <div className="space-y-2">
            <button onClick={onCopyContract} className="w-full text-xs font-semibold tracking-wide px-3 py-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] hover:text-black hover:bg-[var(--accent)] transition-colors">
                {contractCopyText}
            </button>
            <button onClick={onCopyFunding} className="w-full text-xs font-semibold tracking-wide px-3 py-2 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                {fundingCopyText}
            </button>
        </div>
    </div>
);

const LaunchPanel = ({ config, onLaunch }: { config: NetworkConfig; onLaunch: () => void }) => {
    const launchChecks = [
        { label: 'RPC', value: stripProtocol(config.rpcUrl) },
        { label: 'Explorer', value: stripProtocol(config.explorerUrl) },
        { label: 'Faucet', value: stripProtocol(config.faucetUrl) },
        { label: 'Contract', value: formatAddress(config.nftContract) },
        { label: 'Treasury', value: formatAddress(config.fundingWallet) },
    ];

    return (
        <div className="fixed top-28 right-6 z-10 w-80 max-w-[90vw] p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--accent)]">Launch Page</p>
                    <h2 className="text-lg font-semibold tracking-wide">Gorweld Deployment</h2>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] uppercase tracking-[0.3em]">Live</span>
            </div>
            <div className="space-y-2 text-xs">
                {launchChecks.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-soft)]">{item.label}</span>
                        <span className="font-semibold tracking-wider text-[var(--text-main)]">{item.value}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={onLaunch} className="flex-1 text-xs font-semibold tracking-wide px-3 py-2 rounded-xl bg-[var(--accent)] text-black hover:bg-white transition-colors">
                    Open Manifesto
                </button>
                <a
                    href={config.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs font-semibold tracking-wide px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-main)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors text-center"
                >
                    View Explorer
                </a>
            </div>
        </div>
    );
};

const LaunchHero = ({ config, onManifest }: { config: NetworkConfig; onManifest: () => void }) => {
    const highlights = [
        { label: 'Chain ID', value: config.chainId },
        { label: 'RPC Node', value: stripProtocol(config.rpcUrl) },
        { label: 'Contract', value: formatAddress(config.nftContract) },
        { label: 'Treasury', value: formatAddress(config.fundingWallet) },
    ];

    const missionLog = [
        { label: 'Telemetry', detail: 'Welder drones synced to Gorbagana RPC stack', status: 'Nominal' },
        { label: 'Fabrication', detail: 'NFT contract primed for weld signatures', status: 'Ready' },
        { label: 'Propulsion', detail: 'Launch cranes sweeping perimeter for debris', status: 'Active' },
        { label: 'Fuel', detail: 'Top up treasury wallet with testnet GOR before pushing mint', status: 'Pending' },
    ];

    const statusColor = (status: string) => {
        switch (status) {
            case 'Nominal':
                return 'bg-emerald-500/20 text-emerald-300';
            case 'Ready':
                return 'bg-cyan-500/20 text-cyan-200';
            case 'Active':
                return 'bg-amber-500/20 text-amber-200';
            default:
                return 'bg-red-500/20 text-red-200';
        }
    };

    return (
        <section className="fixed top-28 left-6 z-10 w-[min(520px,calc(100%-3rem))] space-y-3 pointer-events-none">
            <div className="pointer-events-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 backdrop-blur-xl shadow-2xl p-6 space-y-5">
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--accent)]">Launch Site</p>
                    <h1 className="text-3xl font-semibold tracking-wide leading-tight">Ignite the Gorbagana Weld</h1>
                    <p className="text-sm text-[var(--text-soft)]">
                        Industrial-grade NFTs staged in a live landfill hangar. Review the launch packet, sync wallets, and confirm telemetry before you mint.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={onManifest} className="flex-1 min-w-[140px] text-xs font-semibold tracking-wide px-4 py-2 rounded-2xl bg-[var(--accent)] text-black hover:bg-white transition-colors">
                        Open Manifesto
                    </button>
                    <a
                        href={config.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] text-xs font-semibold tracking-wide px-4 py-2 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-center"
                    >
                        Visit Explorer
                    </a>
                    <a
                        href={config.faucetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] text-xs font-semibold tracking-wide px-4 py-2 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-center"
                    >
                        Get Test GOR
                    </a>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-xs">
                    {highlights.map((item) => (
                        <div key={item.label} className="bg-[var(--bg-soft)]/60 border border-[var(--border-subtle)] rounded-2xl p-3">
                            <dt className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-soft)]">{item.label}</dt>
                            <dd className="mt-2 font-semibold tracking-wide text-[var(--text-main)]">{item.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="pointer-events-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/90 backdrop-blur-xl shadow-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--accent)]">Mission Log</p>
                    <span className="text-[10px] text-[var(--text-soft)]">Live feed</span>
                </div>
                <ol className="space-y-3">
                    {missionLog.map((entry) => (
                        <li key={entry.label} className="flex items-start gap-3">
                            <span className={`text-[10px] px-2 py-1 rounded-full ${statusColor(entry.status)} uppercase tracking-[0.3em]`}>{entry.status}</span>
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-[var(--text-main)]">{entry.label}</p>
                                <p className="text-xs text-[var(--text-soft)]">{entry.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

// --- Main App Component ---
const App = () => {
    const contractAddress = gorbaganaConfig.nftContract;
    const [copyText, setCopyText] = useState('Click to Copy');
    const [fundingCopyText, setFundingCopyText] = useState('Copy Funding Wallet');
    const [showOverlay, setShowOverlay] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(contractAddress).then(() => {
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Click to Copy'), 2000);
        });
    }, [contractAddress]);

    const handleFundingCopy = useCallback(() => {
        navigator.clipboard.writeText(gorbaganaConfig.fundingWallet).then(() => {
            setFundingCopyText('Wallet Copied!');
            setTimeout(() => setFundingCopyText('Copy Funding Wallet'), 2000);
        });
    }, []);

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
                        <a href="https://docs.gorbagana.wtf/" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-xs font-bold px-4 py-2 rounded-full border border-[var(--border-subtle)] hover:border-white transition-colors bg-[var(--bg)]/50 backdrop-blur-sm">
                            Docs
                        </a>
                        <a href={gorbaganaConfig.explorerUrl} target="_blank" rel="noopener noreferrer" className="hidden md:block text-[10px] font-bold px-4 py-2 rounded-full border border-[var(--border-subtle)] hover:border-white transition-colors bg-[var(--bg)]/50 backdrop-blur-sm">
                            Open Explorer
                        </a>
                        <a href={gorbaganaConfig.faucetUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:block text-xs font-bold px-4 py-2 rounded-full border border-[var(--border-subtle)] hover:border-white transition-colors bg-[var(--bg)]/50 backdrop-blur-sm">
                            Request Test GOR
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
                    
                        <ScrapCrane />
                        <GorbaganaBeacon />
                        <ToxicBarrels />
                        <JunkPiles />
                        <PatrolDrones />
                    <ContactShadows position={[0, -1.45, 0]} opacity={0.75} scale={40} blur={2.5} far={10} />
                    <DeformedGround />
                    <DustParticles />

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.5} intensity={2} mipmapBlur luminanceSmoothing={0.5} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
            <LaunchHero config={gorbaganaConfig} onManifest={() => setShowOverlay(true)} />
            <NetworkPanel
                config={gorbaganaConfig}
                contractCopyText={copyText}
                onCopyContract={handleCopy}
                fundingCopyText={fundingCopyText}
                onCopyFunding={handleFundingCopy}
            />
            <LaunchPanel config={gorbaganaConfig} onLaunch={() => setShowOverlay(true)} />
            <CustomLoader />
            {showOverlay && <InfoOverlay onClose={() => setShowOverlay(false)} config={gorbaganaConfig} />}
             <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 text-center text-xs text-[var(--text-soft)] tracking-widest pointer-events-none">
                CLICK & DRAG TO EXPLORE // CONFIGURED FOR GORBAGANA TESTNET
            </footer>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);