import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Camera,
  ChevronDown,
  CircleDot,
  EyeOff,
  Grid3X3,
  Heart,
  Layers3,
  Library,
  Maximize2,
  NotebookTabs,
  RotateCcw,
  ScanLine,
  Settings,
  Sparkles,
} from 'lucide-react';
import CellViewer, { preloadCellModels } from './components/CellViewer.jsx';
import { cells, microscopeSlots } from './data/cells.js';

function CellThumb({ cell }) {
  return (
    <span className={`cell-thumb cell-thumb-${cell.id}`} style={{ '--accent': cell.accent }}>
      {cell.thumbnail ? <img src={cell.thumbnail} alt={cell.name} decoding="async" /> : <i />}
    </span>
  );
}

function Toggle({ checked, onChange, color }) {
  return (
    <button className={`toggle ${checked ? 'is-on' : ''}`} onClick={onChange} style={{ '--accent': color }} aria-pressed={checked}>
      <span />
    </button>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState('plant');
  const [crossSection, setCrossSection] = useState(true);
  const [isolate, setIsolate] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [assetState, setAssetState] = useState('正在加载 3D 素材');

  const activeCell = useMemo(() => cells.find((item) => item.id === activeId) ?? cells[0], [activeId]);
  const compareCells = activeCell.compare.map((name) => cells.find((cell) => cell.name === name)).filter(Boolean);

  useEffect(() => {
    preloadCellModels(cells.map((cell) => cell.model));
  }, []);

  const resetView = () => {
    setAutoRotate(false);
    window.dispatchEvent(new Event('cellviewer:reset'));
    requestAnimationFrame(() => setAutoRotate(true));
  };

  return (
    <main className="studio" style={{ '--accent': activeCell.accent }}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>细胞建筑实验室</h1>
            <p>在微观层级探索生命结构</p>
          </div>
        </div>

        <nav className="nav-icons" aria-label="主导航">
          <button title="图库"><Grid3X3 size={20} /><span>图库</span></button>
          <button title="素材库"><Library size={20} /><span>素材库</span></button>
          <button title="笔记"><NotebookTabs size={20} /><span>笔记</span></button>
          <button title="设置"><Settings size={20} /><span>设置</span></button>
        </nav>

        <button className="profile" title="账户">
          <CellThumb cell={activeCell} />
          <ChevronDown size={18} />
        </button>
      </header>

      <section className="workbench">
        <aside className="left-rail panel">
          <div className="panel-title">
            <span>细胞类型</span>
            <ChevronDown size={16} />
          </div>
          <div className="cell-list">
            {cells.map((cell) => (
              <button
                key={cell.id}
                className={`cell-row ${activeId === cell.id ? 'is-active' : ''}`}
                onClick={() => setActiveId(cell.id)}
                style={{ '--accent': cell.accent }}
              >
                <CellThumb cell={cell} />
                <span>
                  <strong>{cell.name}</strong>
                  <small>{cell.family}</small>
                </span>
                <Sparkles size={14} />
              </button>
            ))}
          </div>
        </aside>

        <section className="center-stage panel">
          <div key={`copy-${activeCell.id}`} className="stage-copy">
            <p className="family-kicker">{activeCell.family}</p>
            <h2 className="name-split" aria-label={activeCell.name}>
              {Array.from(activeCell.name).map((char, index) => (
                <span key={`${char}-${index}`} style={{ '--delay': `${index * 58}ms` }} aria-hidden="true">
                  {char}
                </span>
              ))}
            </h2>
          </div>

          <div className="tip-note">
            <strong>提示</strong>
            拖动旋转，滚轮缩放，切换模式查看内部层次。
          </div>

          <div className="view-mode">
            <span>视图模式</span>
            <div className="mode-buttons">
              <button title="完整模型" className={!crossSection ? 'is-active' : ''} onClick={() => setCrossSection(false)}>
                <Box size={19} />
              </button>
              <button title="切面层级" className={crossSection ? 'is-active' : ''} onClick={() => setCrossSection(true)}>
                <Layers3 size={19} />
              </button>
              <button title="观察点">
                <CircleDot size={19} />
              </button>
            </div>
            <label className="control-line">
              <span>切面</span>
              <Toggle checked={crossSection} onChange={() => setCrossSection((value) => !value)} color={activeCell.accent} />
            </label>
          </div>

          <div key={`viewer-${activeCell.id}`} className="viewer-motion">
            <CellViewer
              cell={activeCell}
              crossSection={crossSection}
              isolate={isolate}
              autoRotate={autoRotate}
              onAssetState={setAssetState}
            />
          </div>

          <div className="stage-actions">
            <button onClick={() => setAutoRotate((value) => !value)}><RotateCcw size={16} />旋转</button>
            <button onClick={() => setIsolate((value) => !value)}><ScanLine size={16} />隔离</button>
            <button onClick={() => setIsolate(false)}><EyeOff size={16} />显示全部</button>
            <button onClick={resetView}><Maximize2 size={16} />重置视图</button>
            <span />
            <button><Camera size={16} />截图</button>
            <button><Box size={16} />3D 导出</button>
          </div>
        </section>

        <aside className="right-rail">
          <section className="panel detail-card">
            <div className="panel-title">
              <span>结构详情</span>
              <Heart size={17} fill="currentColor" />
            </div>
            <div key={`detail-${activeCell.id}`} className="detail-head detail-motion">
              <CellThumb cell={activeCell} />
              <div>
                <h3>{activeCell.detail.title}</h3>
                <p>{activeCell.detail.subtitle}</p>
              </div>
            </div>
            <dl>
              {activeCell.detail.facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <label className="control-line">
              <span>标签</span>
              <Toggle checked={isolate} onChange={() => setIsolate((value) => !value)} color={activeCell.accent} />
            </label>
          </section>

          <section className="panel notes-card">
            <div className="panel-title">
              <span>生物笔记</span>
            </div>
            <p>{activeCell.detail.note}</p>
            <div className="asset-state">{assetState}</div>
          </section>

          <section className="panel place-card">
            <div className="panel-title">
              <span>出现位置</span>
            </div>
            {activeCell.locationImage ? (
              <img
                key={`location-${activeCell.id}`}
                className="location-image location-motion"
                src={activeCell.locationImage}
                alt={`${activeCell.name}出现位置`}
                decoding="async"
              />
            ) : (
              <div key={`location-empty-${activeCell.id}`} className="image-placeholder location-motion">
                <span>暂无图片</span>
              </div>
            )}
            <p>{activeCell.detail.place}</p>
          </section>
        </aside>
      </section>

      <section className="lower-grid">
        <aside className="panel organelles">
          <div className="panel-title">
            <span>细胞器</span>
            <ChevronDown size={16} />
          </div>
          <ul>
            {activeCell.organelles.map((item, index) => (
              <li key={item}>
                <b style={{ background: index === 0 ? activeCell.accent : undefined }} />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel microscope">
          <div className="panel-title">
            <span>显微镜视图</span>
            <CircleDot size={16} />
          </div>
          <div className="micro-grid">
            {microscopeSlots.map((slot, index) => (
              <button key={slot}>
                {activeCell.microscopeImages?.[index] ? (
                  <img
                    key={`${activeCell.id}-${slot}`}
                    className="micro-image micro-motion"
                    src={activeCell.microscopeImages[index]}
                    alt={`${activeCell.name}${slot}`}
                    loading="lazy"
                    decoding="async"
                    style={{ '--delay': `${index * 82}ms` }}
                  />
                ) : (
                  <span
                    key={`${activeCell.id}-${slot}-empty`}
                    className={`micro-placeholder micro-${index + 1} micro-motion`}
                    style={{ '--delay': `${index * 82}ms` }}
                  />
                )}
                <strong>{slot}</strong>
              </button>
            ))}
            {(activeCell.microscopeImages?.length ?? 0) < microscopeSlots.length && (
              <button className="add-image">
                <strong>+</strong>
                <span>暂无图片</span>
              </button>
            )}
          </div>
        </section>

        <section className="panel compare">
          <div className="panel-title">
            <span>细胞对比</span>
            <CircleDot size={16} />
          </div>
          <div key={`compare-${activeCell.id}`} className="compare-pair compare-motion">
            <div>
              <CellThumb cell={activeCell} />
              <span>{activeCell.name}</span>
              <small>{activeCell.family}</small>
            </div>
            <b>VS</b>
            <div>
              <CellThumb cell={compareCells[0] ?? cells[0]} />
              <span>{compareCells[0]?.name ?? '待选择'}</span>
              <small>{compareCells[0]?.family ?? '添加对象'}</small>
            </div>
          </div>
          <button className="open-compare">打开对比视图</button>
        </section>
      </section>
    </main>
  );
}
