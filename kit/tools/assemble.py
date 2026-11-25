"""Build web/main.js from a base main.js and your own world code (replaces fragile line-number slicing).
usage: python3 assemble.py <base_main.js> <world.part.js> <out_main.js>
The base file must contain the markers `// @@WORLD-BEGIN` and `// @@WORLD-END` (kit/example/wiretap/web/main.js has them).
Everything between the markers is replaced by world.part.js; the part must define what the base's cards/render code expects
(world, worldState(S,f), fog/lights it needs). Workflow after each edit: assemble -> cp story.js web/ -> node --check web/main.js."""
import sys
if len(sys.argv) != 4: sys.exit(__doc__)
base, part, out = sys.argv[1:]
t = open(base).read().split('\n')
try:
    a = next(i for i, l in enumerate(t) if l.startswith('// @@WORLD-BEGIN')); b = next(i for i, l in enumerate(t) if l.startswith('// @@WORLD-END'))
except StopIteration: sys.exit('markers // @@WORLD-BEGIN / // @@WORLD-END not found in ' + base)
if b < a: sys.exit('WORLD-END before WORLD-BEGIN')
open(out, 'w').write('\n'.join(t[:a + 1]) + '\n' + open(part).read() + '\n' + '\n'.join(t[b:]))
print('assembled', out, f'({a + 1} head lines + part + {len(t) - b} tail lines)')
