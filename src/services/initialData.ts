import type {
  User, Task, Phase, Milestone, TechnicalDoc, Component,
  HardwareRevision, FirmwareModule, ResearchEntry, ExperimentLog,
  Issue, DecisionRecord, Meeting, ProjectFile, ActivityLog
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Akanksha Verma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    email: 'akanksha.verma@teamfoc.edu',
    role: 'Project Lead',
    skills: ['FOC Algorithms', 'System Architecture', 'STM32 Firmware', 'MATLAB/Simulink'],
    bio: 'Lead engineering student directing the FOC motor controller design and planetary gear integration.',
    workloadPercentage: 78,
  },
  {
    id: 'u2',
    name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'rahul.sharma@teamfoc.edu',
    role: 'Hardware',
    skills: ['Altium Designer', '4-Layer PCB Design', 'Power MOSFETs', 'Gate Drivers', 'Thermal Analysis'],
    bio: 'Hardware Lead responsible for inverter power stage, PCB layout, and high-current PCB thermals.',
    workloadPercentage: 85,
  },
  {
    id: 'u3',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    email: 'priya.patel@teamfoc.edu',
    role: 'Firmware',
    skills: ['C/C++', 'STM32 CubeIDE', 'CAN-FD Protocol', 'ADC/PWM Timers', 'RTOS'],
    bio: 'Embedded software engineer building real-time 20kHz FOC control loop and CAN-FD interface.',
    workloadPercentage: 70,
  },
  {
    id: 'u4',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'vikram.malhotra@teamfoc.edu',
    role: 'Mechanical',
    skills: ['SolidWorks', 'FEA', 'Planetary Gear Design', 'CNC Machining', 'Thermal Mounts'],
    bio: 'Mechanical engineer designing the compact dual-stage 10:1 planetary gearbox and motor integration.',
    workloadPercentage: 65,
  },
  {
    id: 'u5',
    name: 'Rohan Gupta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'rohan.gupta@teamfoc.edu',
    role: 'Testing',
    skills: ['Oscilloscopes', 'Dynamometer Testing', 'Python Telemetry', 'Fault Diagnosis'],
    bio: 'Test engineer managing dynamometer bench setups, phase current logging, and thermal stress tests.',
    workloadPercentage: 60,
  }
];

export const INITIAL_PHASES: Phase[] = [
  {
    id: 'p1',
    number: 1,
    title: 'Phase 1 — Moteus Study',
    description: 'Deconstruct open-source moteus motor controller: schematic, PCB layout, gate driver, current sensing, and firmware logic.',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    progressPercentage: 90,
    status: 'Completed',
    assigneeName: 'Akanksha Verma',
    milestoneCount: 2,
    dependencies: []
  },
  {
    id: 'p2',
    number: 2,
    title: 'Phase 2 — System Architecture',
    description: 'Define customized BLDC controller specifications: 24V-48V bus, 30A peak, STM32G4 MCU, low-side shunts, 10:1 planetary gearhead.',
    startDate: '2026-07-01',
    endDate: '2026-07-25',
    progressPercentage: 85,
    status: 'Completed',
    assigneeName: 'Rahul Sharma',
    milestoneCount: 2,
    dependencies: ['p1']
  },
  {
    id: 'p3',
    number: 3,
    title: 'Phase 3 — FOC Development',
    description: 'Implement Clarke/Park transforms, Space Vector Modulation (SVPWM), PI current regulators, and AS5047D angle estimation.',
    startDate: '2026-07-20',
    endDate: '2026-08-30',
    progressPercentage: 45,
    status: 'In Progress',
    assigneeName: 'Akanksha Verma',
    milestoneCount: 3,
    dependencies: ['p2']
  },
  {
    id: 'p4',
    number: 4,
    title: 'Phase 4 — Hardware Development',
    description: 'Design custom 4-layer inverter PCB, DRV8323RS gate driver routing, high-current bus copper pours, and Rev 1 manufacturing.',
    startDate: '2026-07-15',
    endDate: '2026-09-10',
    progressPercentage: 35,
    status: 'In Progress',
    assigneeName: 'Rahul Sharma',
    milestoneCount: 3,
    dependencies: ['p2']
  },
  {
    id: 'p5',
    number: 5,
    title: 'Phase 5 — Firmware Development',
    description: 'Build STM32G4 bare-metal firmware: 20kHz complementary PWM timer setup, 3-channel ADC DMA, CAN-FD stack, watchdog safety.',
    startDate: '2026-08-01',
    endDate: '2026-09-25',
    progressPercentage: 20,
    status: 'In Progress',
    assigneeName: 'Priya Patel',
    milestoneCount: 2,
    dependencies: ['p3']
  },
  {
    id: 'p6',
    number: 6,
    title: 'Phase 6 — Mechanical Integration',
    description: 'Machine 7075 aluminum planetary gearbox housing, press-fit bearings, assemble sun/planet gears, and couple to BLDC motor.',
    startDate: '2026-08-20',
    endDate: '2026-10-10',
    progressPercentage: 10,
    status: 'Upcoming',
    assigneeName: 'Vikram Malhotra',
    milestoneCount: 2,
    dependencies: ['p2']
  },
  {
    id: 'p7',
    number: 7,
    title: 'Phase 7 — Testing & Characterization',
    description: 'Bench dynamometer testing, closed-loop current control tuning, gearbox backlash & efficiency measurements, thermal runs.',
    startDate: '2026-09-15',
    endDate: '2026-10-30',
    progressPercentage: 0,
    status: 'Upcoming',
    assigneeName: 'Rohan Gupta',
    milestoneCount: 2,
    dependencies: ['p4', 'p5', 'p6']
  },
  {
    id: 'p8',
    number: 8,
    title: 'Phase 8 — Final Prototype & Demonstration',
    description: 'Integrated actuator package demonstration, full engineering documentation package, final efficiency report.',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    progressPercentage: 0,
    status: 'Upcoming',
    assigneeName: 'Akanksha Verma',
    milestoneCount: 1,
    dependencies: ['p7']
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    phaseId: 'p1',
    title: 'Understand Moteus Architecture',
    description: 'Thoroughly analyze Moteus r4.11 schematics, component selection, current sensing topology, and firmware execution model.',
    deadline: '2026-07-15',
    progressPercentage: 65,
    isCurrent: true,
    subtasks: [
      { id: 'ms1', title: 'Understand hardware architecture', completed: true },
      { id: 'ms2', title: 'Study PCB layout & power ground strategy', completed: true },
      { id: 'ms3', title: 'Identify gate driver & MOSFET components', completed: true },
      { id: 'ms4', title: 'Understand low-side shunt current sensing', completed: true },
      { id: 'ms5', title: 'Understand position sensing (AS5047D SPI)', completed: true },
      { id: 'ms6', title: 'Understand MCU (STM32G4) peripheral map', completed: true },
      { id: 'ms7', title: 'Understand CAN-FD transceiver architecture', completed: false },
      { id: 'ms8', title: 'Study firmware execution loop structure', completed: false },
      { id: 'ms9', title: 'Understand FOC Clarke/Park implementation in C++', completed: false }
    ]
  },
  {
    id: 'm2',
    phaseId: 'p4',
    title: 'FOC Inverter Hardware Rev 1 Fabricated',
    description: 'Complete 4-layer PCB routing in Altium, generate Gerbers, send to fabrication house, and assemble prototype components.',
    deadline: '2026-08-25',
    progressPercentage: 40,
    isCurrent: false,
    subtasks: [
      { id: 'ms21', title: 'Complete schematic capture in Altium', completed: true },
      { id: 'ms22', title: 'Place power stage MOSFETs & DC bus caps', completed: true },
      { id: 'ms23', title: 'Route low-noise current sense differential pairs', completed: false },
      { id: 'ms24', title: 'Export Gerber & drill files for fab', completed: false }
    ]
  },
  {
    id: 'm3',
    phaseId: 'p6',
    title: '10:1 Planetary Gearbox Prototype Machined',
    description: 'CNC machine aluminum housing, press planet gear needle bearings, and integrate output shaft.',
    deadline: '2026-09-15',
    progressPercentage: 15,
    isCurrent: false,
    subtasks: [
      { id: 'ms31', title: 'SolidWorks 3D CAD modeling & gear tooth generation', completed: true },
      { id: 'ms32', title: 'FEA stress simulation under 15 Nm load', completed: false },
      { id: 'ms33', title: 'CNC milling 7075 aluminum carrier housing', completed: false }
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Analyze low-side shunt resistor current sensing circuit in Moteus',
    description: 'Study how Moteus filters current shunt signals before feeding into STM32 ADC. Measure differential amplifier gain and RC low-pass cut-off frequency.',
    assignedToId: 'u1',
    assignedToName: 'Akanksha Verma',
    assignedToAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    priority: 'High',
    status: 'Completed',
    category: 'Research',
    startDate: '2026-06-10',
    deadline: '2026-06-20',
    estimatedEffortHours: 12,
    actualEffortHours: 14,
    milestoneId: 'm1',
    milestoneTitle: 'Understand Moteus Architecture',
    relatedDocId: 'd2',
    relatedDocTitle: 'Moteus Motor Controller Hardware Architecture Analysis',
    checklist: [
      { id: 'c1', title: 'Extract schematic snippet for current sense', completed: true },
      { id: 'c2', title: 'Calculate gain = R_feedback / R_in', completed: true },
      { id: 'c3', title: 'Simulate differential filter in LTSpice', completed: true }
    ],
    comments: [
      { id: 'cm1', authorId: 'u2', authorName: 'Rahul Sharma', authorAvatar: '', content: 'Moteus uses 0.5 mΩ shunts with DRV8323 integrated operational amplifiers at 20x gain. Works well up to 30A.', createdAt: '2026-06-18' }
    ],
    dependencies: [],
    createdBy: 'Akanksha Verma',
    createdDate: '2026-06-10',
    lastUpdated: '2026-06-20',
    tags: ['CurrentSensing', 'MoteusStudy', 'Hardware']
  },
  {
    id: 't2',
    title: 'Implement Clarke & Park Transforms in STM32 C Firmware',
    description: 'Write optimized C functions for Clarke ($I_\alpha, I_\beta$) and Park ($I_d, I_q$) transforms using STM32G4 CORDIC math accelerator.',
    assignedToId: 'u3',
    assignedToName: 'Priya Patel',
    assignedToAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    priority: 'Critical',
    status: 'In Progress',
    category: 'FOC',
    startDate: '2026-07-25',
    deadline: '2026-08-12',
    estimatedEffortHours: 20,
    actualEffortHours: 16,
    milestoneId: 'm1',
    milestoneTitle: 'Understand Moteus Architecture',
    relatedDocId: 'd1',
    relatedDocTitle: 'Field-Oriented Control (FOC) Fundamentals & Transforms',
    checklist: [
      { id: 'c4', title: 'Write Clarke transform function', completed: true },
      { id: 'c5', title: 'Write Park transform function with sin/cos lookup', completed: true },
      { id: 'c6', title: 'Integrate STM32G4 CORDIC hardware acceleration', completed: false },
      { id: 'c7', title: 'Bench test transforms with dummy current inputs', completed: false }
    ],
    comments: [],
    dependencies: ['t1'],
    createdBy: 'Akanksha Verma',
    createdDate: '2026-07-25',
    lastUpdated: '2026-08-02',
    tags: ['FOC', 'Firmware', 'STM32G4']
  },
  {
    id: 't3',
    title: 'Route 4-layer Inverter PCB for DRV8323RS and BSC014N04LS MOSFETs',
    description: 'Layout high current DC bus copper pours, place decoupling ceramic capacitors close to MOSFET drains, and route differential current sense lines with shield grounds.',
    assignedToId: 'u2',
    assignedToName: 'Rahul Sharma',
    assignedToAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    priority: 'Critical',
    status: 'In Progress',
    category: 'Hardware',
    startDate: '2026-07-20',
    deadline: '2026-08-15',
    estimatedEffortHours: 35,
    actualEffortHours: 28,
    milestoneId: 'm2',
    milestoneTitle: 'FOC Inverter Hardware Rev 1 Fabricated',
    relatedDocId: 'd4',
    relatedDocTitle: 'Hardware & Inverter PCB Specification',
    checklist: [
      { id: 'c8', title: 'Complete component placement on Top layer', completed: true },
      { id: 'c9', title: 'Define GND solid ground plane on Layer 2', completed: true },
      { id: 'c10', title: 'Route 6-phase gate drive signals with 20-mil trace width', completed: true },
      { id: 'c11', title: 'Run Design Rule Check (DRC) for clearance & vias', completed: false }
    ],
    comments: [],
    dependencies: [],
    createdBy: 'Rahul Sharma',
    createdDate: '2026-07-20',
    lastUpdated: '2026-08-04',
    tags: ['PCB', 'Altium', 'Hardware', 'Inverter']
  },
  {
    id: 't4',
    title: 'Design 10:1 Dual-Stage Planetary Gearbox in SolidWorks',
    description: 'Calculate gear pitch diameter, module size (m=0.8), sun gear tooth count (z1=12), planet gears (z2=24), and ring gear (z3=60). Perform FEA tooth stress analysis.',
    assignedToId: 'u4',
    assignedToName: 'Vikram Malhotra',
    assignedToAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    priority: 'High',
    status: 'Under Review',
    category: 'Mechanical',
    startDate: '2026-07-15',
    deadline: '2026-08-10',
    estimatedEffortHours: 25,
    actualEffortHours: 26,
    milestoneId: 'm3',
    milestoneTitle: '10:1 Planetary Gearbox Prototype Machined',
    relatedDocId: 'd3',
    relatedDocTitle: 'Planetary Gearhead Design & Reduction Ratios',
    checklist: [
      { id: 'c12', title: 'Determine module m=0.8 for compact size', completed: true },
      { id: 'c13', title: '3D modeling of planet carrier & needle bearing seats', completed: true },
      { id: 'c14', title: 'Run FEA static stress under 15 Nm stall torque', completed: true }
    ],
    comments: [
      { id: 'cm2', authorId: 'u1', authorName: 'Akanksha Verma', authorAvatar: '', content: 'FEA results show max Von Mises stress 142 MPa, well below 7075-T6 yield strength of 500 MPa. Looks ready for machining!', createdAt: '2026-08-03' }
    ],
    dependencies: [],
    createdBy: 'Vikram Malhotra',
    createdDate: '2026-07-15',
    lastUpdated: '2026-08-03',
    tags: ['PlanetaryGearbox', 'Mechanical', 'SolidWorks']
  },
  {
    id: 't5',
    title: 'Debug Current Loop Phase Oscillation in Test #03',
    description: 'Investigate why q-axis current oscillates when target exceeds 1.5A. Tune PI current loop gains (Kp and Ki) and check ADC sampling sync with PWM midpoint.',
    assignedToId: 'u5',
    assignedToName: 'Rohan Gupta',
    assignedToAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    priority: 'Critical',
    status: 'Blocked',
    category: 'Testing',
    startDate: '2026-08-01',
    deadline: '2026-08-08',
    estimatedEffortHours: 16,
    actualEffortHours: 10,
    milestoneId: 'm1',
    milestoneTitle: 'Understand Moteus Architecture',
    relatedDocId: 'd5',
    relatedDocTitle: 'Testing Procedures & Characterization',
    checklist: [
      { id: 'c15', title: 'Capture phase A current on oscilloscope', completed: true },
      { id: 'c16', title: 'Verify ADC trigger happens during center PWM low', completed: true },
      { id: 'c17', title: 'Reduce Kp from 0.45 to 0.15', completed: false }
    ],
    comments: [],
    dependencies: ['t2'],
    createdBy: 'Rohan Gupta',
    createdDate: '2026-08-01',
    lastUpdated: '2026-08-04',
    tags: ['Testing', 'CurrentControl', 'Oscillation', 'FOC']
  },
  {
    id: 't6',
    title: 'Configure CAN-FD Transceiver (TCAN1042) on STM32G4 FDCAN1',
    description: 'Setup FDCAN1 peripheral in STM32 CubeMX with 1 Mbps arbitration bitrate and 5 Mbps data phase bitrate for fast telemetry transmission.',
    assignedToId: 'u3',
    assignedToName: 'Priya Patel',
    assignedToAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    priority: 'Medium',
    status: 'Not Started',
    category: 'Firmware',
    startDate: '2026-08-10',
    deadline: '2026-08-20',
    estimatedEffortHours: 14,
    actualEffortHours: 0,
    checklist: [
      { id: 'c18', title: 'Initialize FDCAN GPIO pins & bit timing registers', completed: false },
      { id: 'c19', title: 'Implement telemetry packet struct for position/velocity/current', completed: false }
    ],
    comments: [],
    dependencies: [],
    createdBy: 'Priya Patel',
    createdDate: '2026-08-02',
    lastUpdated: '2026-08-02',
    tags: ['CANFD', 'Firmware', 'STM32G4']
  },
  {
    id: 't7',
    title: 'Order Sample Parts: DRV8323RS, BSC014N04LS, AS5047D',
    description: 'Place order on DigiKey for initial PCB assembly components.',
    assignedToId: 'u2',
    assignedToName: 'Rahul Sharma',
    assignedToAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    priority: 'Medium',
    status: 'Completed',
    category: 'Management',
    startDate: '2026-07-05',
    deadline: '2026-07-12',
    estimatedEffortHours: 4,
    actualEffortHours: 3,
    checklist: [
      { id: 'c20', title: 'Create BOM list', completed: true },
      { id: 'c21', title: 'Submit purchase requisition', completed: true }
    ],
    comments: [],
    dependencies: [],
    createdBy: 'Rahul Sharma',
    createdDate: '2026-07-05',
    lastUpdated: '2026-07-12',
    tags: ['Management', 'Components', 'BOM']
  }
];

export const INITIAL_TECHNICAL_DOCS: TechnicalDoc[] = [
  {
    id: 'd1',
    title: 'Field-Oriented Control (FOC) Fundamentals & Transforms',
    category: 'FOC',
    content: `# Field-Oriented Control (FOC) Fundamentals

Field-Oriented Control (FOC), also known as Vector Control, allows precise independent control of motor magnetic flux (d-axis) and output electromagnetic torque (q-axis) in 3-phase BLDC / Permanent Magnet Synchronous Motors (PMSM).

---

## 1. Mathematical Transforms

### Clarke Transform ($a, b, c \\rightarrow \\alpha, \\beta$)
Converts 3-phase stationary frame currents ($i_a, i_b, i_c$) into 2-phase stationary orthogonal frame currents ($i_\\alpha, i_\\beta$):

$$\\begin{bmatrix} i_\\alpha \\\\ i_\\beta \\end{bmatrix} = \\begin{bmatrix} 1 & 0 \\\\ \\frac{1}{\\sqrt{3}} & \\frac{2}{\\sqrt{3}} \\end{bmatrix} \\begin{bmatrix} i_a \\\\ i_b \\end{bmatrix}$$

Assuming balanced 3-phase system where $i_a + i_b + i_c = 0$.

### Park Transform (\\alpha, \\beta \\rightarrow d, q)
Rotates stationary $\\alpha, \\beta$ currents into the rotor-attached synchronous reference frame using electrical angle $\\theta_e$:

$$\\begin{bmatrix} i_d \\\\ i_q \\end{bmatrix} = \\begin{bmatrix} \\cos\\theta_e & \\sin\\theta_e \\\\ -\\sin\\theta_e & \\cos\\theta_e \\end{bmatrix} \\begin{bmatrix} i_\\alpha \\\\ i_\\beta \\end{bmatrix}$$

* **$i_d$ (Direct Axis Current)**: Produces magnetic flux along the rotor poles. Set $i_d^* = 0$ for maximum torque per ampere (MTPA).
* **$i_q$ (Quadrature Axis Current)**: Produces electromagnetic torque:

$$\\tau_e = \\frac{3}{2} p \\left[ \\lambda_f i_q + (L_d - L_q) i_d i_q \\right]$$

For surface-mount permanent magnet BLDC ($L_d \\approx L_q$):
$$\\tau_e = \\frac{3}{2} p \\lambda_f i_q = K_t i_q$$

---

## 2. Space Vector PWM (SVPWM)
SVPWM synthesizes a smooth rotating voltage vector inside an 8-state inverter space vector hexagon (6 active states $V_1 \\dots V_6$, 2 zero states $V_0, V_7$).

* Maximizes DC bus utilization by **15.4%** compared to standard sine-wave PWM.
* Reduces current ripple and acoustic motor noise.

---

## 3. Control Loop Architecture

\`\`\`
[Position Cmd] -> [Pos PI] -> [Vel PI] -> [iq*] -> [Current PI q] -> [Vq] -\
                                        -> [id*=0] -> [Current PI d] -> [Vd] --> [Inv Park] -> [SVPWM] -> [Gate Driver] -> [Inverter]
                                                                                                                              |
[Encoder AS5047D] -----------------------------------------------------> theta_e, omega                                    [Shunts] -> ADC DMA -> [Clarke] -> [Park]
\`\`\`

---

## 4. PI Controller Tuning Strategy
1. Tune **Current Loop ($i_d, i_q$)** first at 20 kHz loop rate. Bandwidth target $\\approx 1000 \\text{ Hz}$.
2. Set $K_p = L_q \\cdot \\omega_{bw}$, $K_i = R_s \\cdot \\omega_{bw}$.
3. Tune **Speed Loop** at 1 kHz loop rate.
4. Tune **Position Loop** at 500 Hz loop rate.`,
    authorName: 'Akanksha Verma',
    lastUpdated: '2026-08-01',
    tags: ['FOC', 'Clarke', 'Park', 'SVPWM', 'ControlTheory']
  },
  {
    id: 'd2',
    title: 'Moteus Motor Controller Hardware Architecture Analysis',
    category: 'Moteus Study',
    content: `# Moteus Motor Controller Architecture Study

Our goal is to understand the open-source **moteus r4.11** controller by mjbots and extract architectural lessons for our custom FOC drive.

---

## Key Hardware Subsystems

### 1. Power Stage & Gate Driver
* **Gate Driver**: TI DRV8323RS 3-phase gate driver with SPI configuration, integrated triple low-side current sense amplifiers, and programmable gate drive currents (100mA to 1A).
* **Power MOSFETs**: Low $R_{ds(on)}$ N-channel MOSFETs (BSC014N04LS, 40V, 1.4 mΩ).
* **Bulk Capacitance**: Low ESR ceramic capacitors array stacked directly across DC bus rails to absorb high $di/dt$ inductive spikes.

### 2. Current Sensing Topology
* **Method**: Low-side shunt resistor sensing on Phases A, B, and C using 0.5 mΩ 3W precision shunts.
* **Amplification**: DRV8323RS internal PGA (Programmable Gain Amplifier) set to 20x gain with bi-directional 1.65V offset.
* **Filtering**: RC low-pass filter ($R = 100 \\, \\Omega$, $C = 1 \\text{ nF}$) before STM32 ADC pins to filter out high frequency PWM switching noise.

### 3. Position & Rotor Angle Sensing
* **Sensor**: AMS AS5047D 14-bit magnetic rotary encoder mounted directly behind motor rotor magnet.
* **Interface**: High-speed SPI interface (up to 10 MHz) and ABI incremental quadrature output.

### 4. Microcontroller (MCU)
* **MCU**: STM32G431CBT6 (ARM Cortex-M4F at 170 MHz).
* **Peripherals Used**:
  * Advanced Control Timer (TIM1) for 3-phase complementary PWM with dead-time insertion.
  * Dual fast 12-bit ADCs synchronized with TIM1 update event for center-aligned PWM current sampling.
  * Hardware CORDIC coprocessor for ultra-fast trigonometric calculations ($\sin, \cos, \arctan$).
  * FDCAN1 controller for high speed CAN-FD fieldbus telemetry.`,
    authorName: 'Rahul Sharma & Akanksha Verma',
    lastUpdated: '2026-07-28',
    tags: ['Moteus', 'DRV8323', 'STM32G4', 'CurrentSensing', 'Hardware']
  },
  {
    id: 'd3',
    title: 'Planetary Gearhead Design & Reduction Ratios',
    category: 'Mechanical',
    content: `# Planetary Gearhead Design & Reduction Ratios

To achieve high torque density in a compact actuator volume, we integrate a **dual-stage 10:1 planetary gear reduction** directly into the BLDC motor front housing.

---

## 1. Gear Kinematics & Ratio Calculation

For a single planetary gear stage with fixed ring gear:

$$\\text{Ratio} N_1 = 1 + \\frac{Z_{\\text{ring}}}{Z_{\\text{sun}}}$$

* Sun gear teeth: $Z_{\\text{sun}} = 14$
* Planet gears teeth: $Z_{\\text{planet}} = 20$
* Ring gear teeth: $Z_{\\text{ring}} = 54$

Stage 1 Ratio:
$$N_1 = 1 + \\frac{54}{14} = 4.857:1$$

Combining two compact stages yields overall reduction **$N_{total} = 10.0:1$**.

---

## 2. Torque Multiplication & Mechanical Efficiency

$$\\tau_{\\text{out}} = \\tau_{\\text{motor}} \\times N_{\\text{total}} \\times \\eta_{\\text{gearbox}}$$

* Target Continuous Motor Torque: $0.45 \\text{ Nm}$
* Target Output Torque: $0.45 \\times 10 \\times 0.88 = 3.96 \\text{ Nm}$ continuous (**12 Nm Peak**).
* Target Mechanical Efficiency: $\\eta \\ge 88\\%$.`,
    authorName: 'Vikram Malhotra',
    lastUpdated: '2026-08-02',
    tags: ['PlanetaryGearbox', 'Mechanical', 'Torque', 'ReductionRatio']
  }
];

export const INITIAL_COMPONENTS: Component[] = [
  {
    id: 'c1',
    name: 'STM32G431CBT6 Microcontroller',
    category: 'MCU',
    manufacturer: 'STMicroelectronics',
    partNumber: 'STM32G431CBT6',
    datasheetUrl: 'https://www.st.com/resource/en/datasheet/stm32g431cb.pdf',
    purpose: 'Main real-time FOC control processor, 20kHz interrupt execution, ADC sampling, CAN-FD communication.',
    specs: {
      voltageRating: '3.3 V',
      clockSpeed: '170 MHz ARM Cortex-M4F',
      package: 'LQFP-48',
      flashRam: '128 KB Flash / 32 KB SRAM'
    },
    costUsd: 4.85,
    availabilityStatus: 'In Stock',
    status: 'Selected',
    reasonForSelection: 'Hardware CORDIC coprocessor for fast sin/cos trig calculations, advanced 3-phase PWM timers, dual fast ADCs, low cost.',
    schematicSection: 'MCU Core & Power',
    pcbLocation: 'U1 (Top Center)',
    notes: 'Requires 100nF decoupling capacitors on all VDD pins.',
    tags: ['MCU', 'STM32G4', 'Selected']
  },
  {
    id: 'c2',
    name: 'DRV8323RS 3-Phase Gate Driver',
    category: 'Gate Driver',
    manufacturer: 'Texas Instruments',
    partNumber: 'DRV8323RSRRGTR',
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/drv8323r.pdf',
    purpose: 'Drive high-side and low-side power MOSFET gates with integrated current shunt sense amplifiers and SPI configuration.',
    specs: {
      voltageRating: '6V - 60V DC',
      gateDriveCurrent: '1A Source / 2A Sink',
      package: 'QFN-40',
      shuntAmps: '3 Integrated Shunt Amplifiers'
    },
    costUsd: 6.20,
    availabilityStatus: 'In Stock',
    status: 'Selected',
    reasonForSelection: 'Matches Moteus gate driver topology, simplifies PCB layout by integrating 3 shunt amplifiers and buck regulator.',
    schematicSection: 'Power & Gate Driver Stage',
    pcbLocation: 'U2 (Middle Power Stage)',
    notes: 'Configured via SPI for 20x gain and smart gate drive current control.',
    tags: ['GateDriver', 'DRV8323', 'Selected']
  },
  {
    id: 'c3',
    name: 'BSC014N04LS 40V Power MOSFET',
    category: 'MOSFET',
    manufacturer: 'Infineon',
    partNumber: 'BSC014N04LSATMA1',
    datasheetUrl: 'https://www.infineon.com/dgdl/Infineon-BSC014N04LS.pdf',
    purpose: '6-MOSFET 3-phase bridge inverter power stage.',
    specs: {
      voltageRating: '40 V',
      currentRating: '100 A',
      package: 'TDSON-8 (5x6 mm)',
      rdsOn: '1.4 mΩ'
    },
    costUsd: 1.45,
    availabilityStatus: 'In Stock',
    status: 'Selected',
    reasonForSelection: 'Extremely low Rds(on) minimizes conduction losses at 30A peak currents.',
    schematicSection: 'Inverter Bridge',
    pcbLocation: 'Q1-Q6 (Bottom Power Layer)',
    notes: 'Requires thermal vias underneath exposed pad for heat sinking.',
    tags: ['MOSFET', 'PowerStage', 'Selected']
  },
  {
    id: 'c4',
    name: 'AS5047D Magnetic Position Sensor',
    category: 'Encoder',
    manufacturer: 'AMS AG',
    partNumber: 'AS5047D-ATSM',
    datasheetUrl: 'https://ams.com/documents/20143/36005/AS5047D_DS000394_2-00.pdf',
    purpose: 'Rotor angle sensing for field orientation and position feedback loop.',
    specs: {
      voltageRating: '3.3V / 5V',
      resolution: '14-bit (16384 positions/rev)',
      package: 'TSSOP-14',
      interface: 'SPI / ABI / PWM'
    },
    costUsd: 5.10,
    availabilityStatus: 'In Stock',
    status: 'Selected',
    reasonForSelection: 'High speed DAEC (Dynamic Angle Error Compensation) enables accurate angle reading up to 28,000 RPM.',
    schematicSection: 'Sensor Interface',
    pcbLocation: 'U5 (Backside Rotor Axis)',
    notes: 'Requires diametrically magnetized magnet placed 1mm above IC.',
    tags: ['Encoder', 'AS5047D', 'PositionSensor']
  },
  {
    id: 'c5',
    name: 'Custom 10:1 Planetary Gearbox Module',
    category: 'Gearbox',
    manufacturer: 'Custom In-House CNC',
    partNumber: 'FOC-GEAR-10X-R1',
    datasheetUrl: '',
    purpose: 'Mechanical speed reduction and 10x torque multiplication.',
    specs: {
      gearRatio: '10:1',
      maxTorque: '15 Nm Peak',
      backlash: '< 15 arcmin',
      material: '7075-T6 Aluminum Carrier / Alloy Steel Gears'
    },
    costUsd: 45.00,
    availabilityStatus: 'Lead Time 2-3w',
    status: 'Selected',
    reasonForSelection: 'Custom dimensions fit directly into the motor housing without heavy adapter plates.',
    schematicSection: 'Mechanical Assembly',
    pcbLocation: 'N/A (Mechanical)',
    notes: 'Needs lithium synthetic grease lubrication.',
    tags: ['Gearbox', 'Mechanical', 'Selected']
  }
];

export const INITIAL_HARDWARE_REVISIONS: HardwareRevision[] = [
  {
    id: 'hr0',
    revName: 'Rev 0 (Evaluation Bench)',
    date: '2026-06-25',
    personResponsible: 'Rahul Sharma',
    changesSummary: 'Initial breadboard evaluation using STM32 Nucleo board connected to commercial DRV8301 break-out board.',
    reasonForChange: 'Validate basic FOC code and SPI sensor communication before custom PCB layout.',
    problemsFound: 'Excessive ground noise during high-current pulses caused ADC trigger jitter.',
    testResultsSummary: 'Motor spun up to 1000 RPM open-loop, but current sensing was noisy.',
    status: 'Deprecated'
  },
  {
    id: 'hr1',
    revName: 'Rev 1 (4-Layer Custom Integrated Inverter)',
    date: '2026-07-28',
    personResponsible: 'Rahul Sharma',
    changesSummary: 'First integrated 4-layer custom PCB design combining STM32G4, DRV8323RS, BSC014N04LS MOSFETs, and low-side shunts.',
    reasonForChange: 'Compact custom form factor matching target actuator motor size.',
    problemsFound: 'q-axis current oscillation above 1.5A due to PI loop gain and RC filter time constant mismatch.',
    testResultsSummary: 'PCB powered up successfully, DRV8323 SPI communication verified, motor spins in closed loop up to 1.5A.',
    status: 'Active Testing'
  },
  {
    id: 'hr2',
    revName: 'Rev 2 (Revised Noise Filter & Solid Ground Plane)',
    date: '2026-09-01',
    personResponsible: 'Rahul Sharma',
    changesSummary: 'Separate analog ground plane (AGND) under current sense amplifiers, added ferrite beads on 3.3V supply, optimized gate drive resistor values.',
    reasonForChange: 'Eliminate remaining current noise and support up to 30A continuous current.',
    problemsFound: 'Pending fabrication.',
    testResultsSummary: 'Design complete, ready for manufacturing order.',
    status: 'Planned Production'
  }
];

export const INITIAL_FIRMWARE_MODULES: FirmwareModule[] = [
  {
    id: 'fm1',
    name: 'FOC Core Control Loop (20 kHz)',
    description: 'Executes Clarke, Park, PI current control, inverse Park, and SVPWM calculation every 50 microseconds in TIM1 PWM update interrupt.',
    status: 'Verified',
    loopFrequency: '20 kHz',
    assignedMember: 'Priya Patel',
    repositoryLink: 'https://github.com/team-foc-drive/foc-firmware/tree/main/Core/Src/foc_loop.c',
    lastCommitHash: 'a7f9b2d',
    notes: 'Optimized with CORDIC hardware acceleration. Takes 14.2 µs execution time.'
  },
  {
    id: 'fm2',
    name: 'ADC 3-Phase Current Sampling & Calibration',
    description: 'Dual ADC DMA transfer triggered at PWM center midpoint to read phase A and phase B low-side shunt voltages.',
    status: 'Testing',
    loopFrequency: '20 kHz synchronized',
    assignedMember: 'Priya Patel',
    repositoryLink: 'https://github.com/team-foc-drive/foc-firmware/tree/main/Core/Src/adc_sense.c',
    lastCommitHash: '8c4e110',
    notes: 'Includes zero-current offset calibration at startup.'
  },
  {
    id: 'fm3',
    name: 'AS5047D Encoder SPI Reader & Angle Estimation',
    description: 'High-speed SPI DMA reader acquiring 14-bit absolute rotor position angle and calculating electrical angle $\\theta_e = p \\cdot \\theta_m$.',
    status: 'Verified',
    loopFrequency: '20 kHz',
    assignedMember: 'Akanksha Verma',
    repositoryLink: 'https://github.com/team-foc-drive/foc-firmware/tree/main/Core/Src/encoder.c',
    lastCommitHash: 'b3910ff',
    notes: 'Handles rollover wrap-around and velocity filtering.'
  },
  {
    id: 'fm4',
    name: 'CAN-FD Communication Protocol Stack',
    description: 'High throughput telemetry sending position, velocity, $i_d, i_q$, voltage, and error flags at 100 Hz.',
    status: 'In Development',
    loopFrequency: '100 Hz',
    assignedMember: 'Priya Patel',
    repositoryLink: 'https://github.com/team-foc-drive/foc-firmware/tree/main/Core/Src/canfd_driver.c',
    lastCommitHash: 'f419c8e',
    notes: 'Compatible with socketCAN protocol.'
  }
];

export const INITIAL_RESEARCH: ResearchEntry[] = [
  {
    id: 'r1',
    topic: 'FOC Current Control & SVPWM',
    title: 'Texas Instruments SPRABQ4: Understanding Field Oriented Control for Permanent Magnet Motors',
    source: 'TI Application Note',
    url: 'https://www.ti.com/lit/an/sprabq4/sprabq4.pdf',
    summary: 'Detailed derivation of FOC vector control, space vector modulation sector calculation, and current sensor calibration methods.',
    importantFindings: 'Center-aligned PWM current sampling eliminates switching noise artifacts if sampled exactly at zero duty transition.',
    equations: [
      'V_alpha = V_d * cos(theta) - V_q * sin(theta)',
      'V_beta = V_d * sin(theta) + V_q * cos(theta)'
    ],
    relevantComponents: ['STM32G431', 'DRV8323RS'],
    applicationToProject: 'Used directly to implement our SVPWM sector lookup code in C.',
    addedBy: 'Akanksha Verma',
    addedDate: '2026-06-15',
    tags: ['FOC', 'SVPWM', 'TI', 'AppNote']
  },
  {
    id: 'r2',
    topic: 'Moteus Open-Source Hardware Analysis',
    title: 'mjbots Moteus r4.11 Controller Design & Firmware Codebase',
    source: 'GitHub Repository',
    url: 'https://github.com/mjbots/moteus',
    summary: 'State-of-the-art open-source BLDC servo drive using STM32G4 and custom CAN-FD stack.',
    importantFindings: 'Uses low-side shunt resistors with DRV8323RS internal operational amplifiers set to 20x gain.',
    equations: [],
    relevantComponents: ['STM32G431', 'DRV8323RS', 'BSC014N04LS', 'AS5047D'],
    applicationToProject: 'Primary benchmark for our hardware component selection and system architecture.',
    addedBy: 'Akanksha Verma',
    addedDate: '2026-06-05',
    tags: ['Moteus', 'OpenSource', 'Hardware', 'Firmware']
  }
];

export const INITIAL_EXPERIMENTS: ExperimentLog[] = [
  {
    id: 'e1',
    title: 'Current Control Loop Step Response & Oscillation Test #03',
    objective: 'Evaluate current controller stability and step response when stepping q-axis target current $i_q^*$ from 0.5A to 2.0A.',
    date: '2026-08-02',
    conductedBy: 'Rohan Gupta & Akanksha Verma',
    hardwareSetup: 'Rev 1 PCB, STM32G4, 24V Power Supply, Oscilloscope with Current Probe',
    motorUsed: 'MAD 5005 350KV BLDC Motor',
    supplyVoltageV: 24,
    supplyCurrentA: 2.2,
    pwmFrequencyKhz: 20,
    motorSpeedRpm: 1200,
    loadTorqueNm: 0.8,
    gearRatio: '1:1 (Direct Drive)',
    controllerSettings: 'Kp_q = 0.45, Ki_q = 0.08, Kp_d = 0.45, Ki_d = 0.08',
    expectedResult: 'Stable q-axis current step settling at 2.0A within 2ms without overshoot.',
    actualResult: 'Sustained 4.2 kHz oscillation observed when $i_q^* > 1.5\\text{ A}$. Amplitude $\\approx \\pm 0.6\\text{ A}$.',
    observations: 'Phase current waveforms show noticeable ringing at switching transitions. Noise coupling into current sense differential traces suspected.',
    problemsEncountered: 'High PI gain $K_p$ amplifies RC filter phase lag at 4.2 kHz.',
    conclusion: 'PI current loop gain is too aggressive for current RC low-pass filter corner frequency (1.6 MHz filter reduced to 160 kHz).',
    nextAction: 'Tune PI gains ($K_p \\rightarrow 0.15$) and increase ADC sampling averaging.',
    dataPoints: [
      { timeMs: 0, targetCurrentA: 0.5, measuredCurrentA: 0.51, speedRpm: 1200, torqueNm: 0.2 },
      { timeMs: 1, targetCurrentA: 0.5, measuredCurrentA: 0.49, speedRpm: 1200, torqueNm: 0.2 },
      { timeMs: 2, targetCurrentA: 2.0, measuredCurrentA: 1.10, speedRpm: 1210, torqueNm: 0.5 },
      { timeMs: 3, targetCurrentA: 2.0, measuredCurrentA: 2.45, speedRpm: 1220, torqueNm: 0.9 },
      { timeMs: 4, targetCurrentA: 2.0, measuredCurrentA: 1.55, speedRpm: 1225, torqueNm: 0.7 },
      { timeMs: 5, targetCurrentA: 2.0, measuredCurrentA: 2.38, speedRpm: 1230, torqueNm: 0.9 },
      { timeMs: 6, targetCurrentA: 2.0, measuredCurrentA: 1.62, speedRpm: 1230, torqueNm: 0.7 },
      { timeMs: 7, targetCurrentA: 2.0, measuredCurrentA: 2.25, speedRpm: 1230, torqueNm: 0.85 },
      { timeMs: 8, targetCurrentA: 2.0, measuredCurrentA: 1.80, speedRpm: 1230, torqueNm: 0.8 },
      { timeMs: 9, targetCurrentA: 2.0, measuredCurrentA: 2.05, speedRpm: 1230, torqueNm: 0.8 },
      { timeMs: 10, targetCurrentA: 2.0, measuredCurrentA: 1.98, speedRpm: 1230, torqueNm: 0.8 }
    ],
    tags: ['Experiment', 'CurrentControl', 'Oscillation', 'FOC']
  },
  {
    id: 'e2',
    title: 'Open-Loop V/f Spin Test & Inverter Thermal Inspection',
    objective: 'Spin BLDC motor in open-loop V/f mode from 100 RPM to 3000 RPM while measuring MOSFET thermal rise with FLIR camera.',
    date: '2026-07-29',
    conductedBy: 'Rohan Gupta & Rahul Sharma',
    hardwareSetup: 'Rev 1 PCB, 24V Supply, FLIR Thermal Imager',
    motorUsed: 'MAD 5005 350KV BLDC Motor',
    supplyVoltageV: 24,
    supplyCurrentA: 1.5,
    pwmFrequencyKhz: 20,
    motorSpeedRpm: 3000,
    loadTorqueNm: 0.1,
    gearRatio: '1:1',
    controllerSettings: 'V/f scalar open-loop',
    expectedResult: 'Smooth rotation without step loss, MOSFET temperature below 50°C.',
    actualResult: 'Motor spun smoothly up to 3000 RPM. Peak MOSFET temperature reached 42°C after 15 minutes continuous run.',
    observations: 'Power stage thermal dissipating effectively through copper ground pours.',
    problemsEncountered: 'None.',
    conclusion: 'Inverter hardware power stage is thermally sound up to 3.5A continuous open loop.',
    nextAction: 'Proceed to closed-loop FOC current control tuning.',
    dataPoints: [
      { timeMs: 0, speedRpm: 100, tempC: 25 },
      { timeMs: 3, speedRpm: 1000, tempC: 31 },
      { timeMs: 6, speedRpm: 2000, tempC: 37 },
      { timeMs: 10, speedRpm: 3000, tempC: 42 }
    ],
    tags: ['Thermal', 'OpenLoop', 'MOSFET', 'Testing']
  }
];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'iss1',
    title: 'Phase current oscillation above 1.5A in q-axis',
    description: 'When stepping target q-axis current $i_q^* > 1.5\\text{ A}$, the measured current exhibits 4.2 kHz oscillation.',
    severity: 'High',
    status: 'Investigating',
    assignedToName: 'Akanksha Verma',
    dateDiscovered: '2026-08-02',
    subsystem: 'FOC Algorithm',
    possibleCause: 'PI gain $K_p$ set too high amplifies low-pass filter phase delay near 4.2 kHz.',
    investigationNotes: 'Captured oscilloscope trace of current sense differential pins. Signal shows 30mV PWM switching ripple.',
    solution: 'Recalculate PI gains using plant parameters ($L_q=42\\mu H, R_s=0.12\\Omega$) and increase ADC oversampling.',
    testResult: 'Pending re-test in Experiment #04.',
    finalConclusion: 'Under investigation.',
    tags: ['FOC', 'CurrentControl', 'Oscillation', 'Issue']
  },
  {
    id: 'iss2',
    title: 'SPI bus conflict between AS5047D encoder and DRV8323RS',
    description: 'Sharing SPI1 bus between encoder and gate driver caused random CRC read errors on position angle.',
    severity: 'Medium',
    status: 'Fixed',
    assignedToName: 'Priya Patel',
    dateDiscovered: '2026-07-26',
    subsystem: 'Firmware',
    possibleCause: 'DRV8323RS requires SPI Mode 1 (CPOL=0, CPHA=1) while AS5047D requires SPI Mode 1 with longer CS setup time.',
    investigationNotes: 'Added 50ns GPIO delay before asserting CS line for AS5047D.',
    solution: 'Dedicated SPI1 for AS5047D and moved DRV8323RS to software bit-bang / SPI2.',
    testResult: 'Zero SPI CRC errors over 1,000,000 read cycles.',
    finalConclusion: 'Issue fully resolved by separating SPI channels.',
    tags: ['SPI', 'Firmware', 'Encoder', 'Fixed']
  }
];

export const INITIAL_DECISIONS: DecisionRecord[] = [
  {
    id: 'dec1',
    title: 'Select current sensing method: Shunt Resistors vs Hall Effect Sensors',
    date: '2026-06-18',
    decision: 'Selected 3x Low-Side Shunt Resistors (0.5 mΩ 2512 3W precision) with DRV8323RS internal operational amplifiers.',
    alternativesConsidered: [
      '1. Inline Hall-Effect Current Sensors (e.g. Allegro ACS712 / TMCS1100)',
      '2. In-phase Inline Shunt Resistors with isolated amplifiers (e.g. AMC1301)',
      '3. Low-side Shunt Resistors with DRV8323 integrated PGAs'
    ],
    advantages: [
      'Matches Moteus open-source proven topology',
      'Extremely compact PCB footprint (no bulky Hall sensors)',
      'Zero magnetic interference from motor high-current leads',
      'Lowest unit BOM cost ($0.30 vs $3.50 per phase)'
    ],
    disadvantages: [
      'Can only sample phase current when low-side MOSFETs are ON (requires synchronized ADC sampling at PWM bottom)'
    ],
    reasonForChoice: 'Provides high bandwidth (2 MHz) required for 20 kHz FOC loop while matching target compact PCB size and low cost.',
    peopleInvolved: ['Akanksha Verma', 'Rahul Sharma', 'Priya Patel'],
    relatedTaskId: 't1',
    relatedDocId: 'd2',
    tags: ['CurrentSensing', 'Shunt', 'ADR', 'Decision']
  },
  {
    id: 'dec2',
    title: 'Select Microcontroller: STM32G431 vs ESP32-S3 vs STM32F4',
    date: '2026-06-22',
    decision: 'Selected STM32G431CBT6 (ARM Cortex-M4F @ 170 MHz).',
    alternativesConsidered: [
      '1. ESP32-S3 Dual Core (244 MHz)',
      '2. STM32F446RE (180 MHz)',
      '3. STM32G431CBT6 (170 MHz)'
    ],
    advantages: [
      'Hardware CORDIC coprocessor for ultra-fast trigonometric calculations (sin, cos, arctan in < 1 µs)',
      'Advanced Timer TIM1 designed specifically for 3-phase complementary PWM with programmable dead-time',
      'Dual fast 12-bit ADCs (up to 5 Msps) with hardware oversampling',
      'Integrated FDCAN controller'
    ],
    disadvantages: [
      'No built-in Wi-Fi/Bluetooth (not required for real-time fieldbus controller)'
    ],
    reasonForChoice: 'The hardware CORDIC accelerator and motor control peripherals make STM32G4 the gold standard for compact FOC drives.',
    peopleInvolved: ['Akanksha Verma', 'Priya Patel'],
    relatedDocId: 'd2',
    tags: ['MCU', 'STM32G4', 'ADR', 'Decision']
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Weekly FOC Architecture & Hardware Progress Sync',
    date: '2026-08-01',
    startTime: '16:00',
    endTime: '17:30',
    locationOrLink: 'Robotics Lab Room 304 / Zoom Link',
    participants: ['Akanksha Verma', 'Rahul Sharma', 'Priya Patel', 'Vikram Malhotra', 'Rohan Gupta'],
    agenda: [
      'Review Moteus current sense schematic study findings',
      'Review Altium 4-layer PCB Rev 1 progress',
      'Discuss current loop oscillation in Experiment #03',
      'Review 10:1 planetary gear SolidWorks model & FEA'
    ],
    notes: `Meeting started at 16:05.
- Akanksha presented Moteus current sense filter analysis. Agreed to keep 0.5 mΩ low-side shunts.
- Rahul showed Altium PCB Rev 1 top layer placement. Power stage layout approved.
- Rohan reported current oscillation above 1.5A in test #03. Akanksha & Priya will tune PI gain Kp.
- Vikram showed 10:1 planetary gear FEA. Stress safety factor is 3.5. Approved for machining.`,
    decisions: [
      'Approved 4-layer PCB Rev 1 power stage layout.',
      'Approved SolidWorks 10:1 planetary gear drawing for CNC machining.'
    ],
    actionItems: [
      { id: 'ai1', title: 'Tune PI current loop gains (Kp, Ki) in FOC firmware', assignedToName: 'Priya Patel', completed: false },
      { id: 'ai2', title: 'Run DRC check on Rev 1 PCB & export Gerbers', assignedToName: 'Rahul Sharma', completed: false },
      { id: 'ai3', title: 'Order 7075 aluminum stock for planetary gear housing', assignedToName: 'Vikram Malhotra', completed: true }
    ],
    followUpDate: '2026-08-08',
    isRecurring: true
  }
];

export const INITIAL_FILES: ProjectFile[] = [
  {
    id: 'f1',
    name: 'STM32G431CBT6_Datasheet.pdf',
    category: 'Datasheets',
    size: '2.4 MB',
    uploadedBy: 'Akanksha Verma',
    uploadedDate: '2026-06-12',
    url: 'https://www.st.com/resource/en/datasheet/stm32g431cb.pdf',
    tags: ['Datasheet', 'STM32G4']
  },
  {
    id: 'f2',
    name: 'DRV8323RS_3Phase_GateDriver.pdf',
    category: 'Datasheets',
    size: '1.8 MB',
    uploadedBy: 'Rahul Sharma',
    uploadedDate: '2026-06-15',
    url: 'https://www.ti.com/lit/ds/symlink/drv8323r.pdf',
    tags: ['Datasheet', 'DRV8323']
  },
  {
    id: 'f3',
    name: 'FOC_Inverter_Rev1_Schematic.pdf',
    category: 'Schematics',
    size: '850 KB',
    uploadedBy: 'Rahul Sharma',
    uploadedDate: '2026-07-25',
    url: '#',
    tags: ['Schematic', 'Rev1', 'Altium']
  },
  {
    id: 'f4',
    name: 'Planetary_Gearbox_10to1_Assembly.STEP',
    category: 'CAD',
    size: '14.2 MB',
    uploadedBy: 'Vikram Malhotra',
    uploadedDate: '2026-07-28',
    url: '#',
    tags: ['CAD', 'SolidWorks', 'PlanetaryGearbox']
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act1',
    personName: 'Rohan Gupta',
    personAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    action: 'recorded experiment',
    targetName: 'Current Control Loop Step Response & Oscillation Test #03',
    category: 'Experiments',
    timestamp: '2 hours ago'
  },
  {
    id: 'act2',
    personName: 'Akanksha Verma',
    personAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    action: 'logged issue',
    targetName: 'Phase current oscillation above 1.5A in q-axis',
    category: 'Issues',
    timestamp: '3 hours ago'
  },
  {
    id: 'act3',
    personName: 'Rahul Sharma',
    personAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    action: 'updated task',
    targetName: 'Route 4-layer Inverter PCB for DRV8323RS',
    category: 'Tasks',
    timestamp: 'Yesterday at 17:40'
  },
  {
    id: 'act4',
    personName: 'Vikram Malhotra',
    personAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    action: 'submitted doc',
    targetName: 'Planetary Gearhead Design & Reduction Ratios',
    category: 'Documentation',
    timestamp: '2 days ago'
  }
];
