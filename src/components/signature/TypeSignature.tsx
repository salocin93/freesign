/**
 * TypeSignature Component
 * 
 * A component that allows users to create typed signatures using various fonts and styles.
 * This provides an alternative to drawing signatures for users who prefer typed text.
 * 
 * Features:
 * - Multiple signature fonts
 * - Font size and color customization
 * - Real-time preview
 * - Export to data URL
 * 
 * Props:
 * @param {string} initialText - Initial text for the signature
 * @param {(dataUrl: string) => void} onSave - Callback when signature is saved
 * @param {() => void} onCancel - Callback when signature creation is cancelled
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

interface TypeSignatureProps {
  initialText?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', value: 'Dancing Script, cursive' },
  { name: 'Great Vibes', value: 'Great Vibes, cursive' },
  { name: 'Pacifico', value: 'Pacifico, cursive' },
  { name: 'Satisfy', value: 'Satisfy, cursive' },
  { name: 'Alex Brush', value: 'Alex Brush, cursive' },
  { name: 'Allura', value: 'Allura, cursive' },
  { name: 'Kaushan Script', value: 'Kaushan Script, cursive' },
  { name: 'Montez', value: 'Montez, cursive' },
  { name: 'Tangerine', value: 'Tangerine, cursive' },
  { name: 'Yellowtail', value: 'Yellowtail, cursive' }
];

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Gray', value: '#6b7280' }
];

export function TypeSignature({ initialText = '', onSave, onCancel }: TypeSignatureProps) {
  const [text, setText] = useState(initialText);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].value);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState(COLORS[0].value);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Alex+Brush&family=Allura&family=Kaushan+Script:wght@400&family=Montez&family=Tangerine:wght@400;700&family=Yellowtail&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Update canvas when signature properties change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font properties
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // Calculate text dimensions
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    // Resize canvas to fit text
    canvas.width = textWidth + 40;
    canvas.height = textHeight + 40;

    // Redraw with new dimensions
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // Draw text
    ctx.fillText(text, 20, canvas.height / 2);
  }, [text, selectedFont, fontSize, color]);

  const handleSave = () => {
    if (!text.trim()) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="signature-text">Signature Text</Label>
        <Input
          id="signature-text"
          data-testid="type-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your signature"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Font Style</Label>
          <Select value={selectedFont} onValueChange={setSelectedFont}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIGNATURE_FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Color</Label>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((colorOption) => (
                <SelectItem key={colorOption.value} value={colorOption.value}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: colorOption.value }}
                    />
                    <span>{colorOption.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Font Size: {fontSize}px</Label>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
          min={24}
          max={72}
          step={2}
          className="mt-2"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <Label>Preview</Label>
          <div className="mt-2 border rounded-md p-4 bg-white min-h-[100px] flex items-center justify-center">
            {text.trim() ? (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto"
                style={{ 
                  fontFamily: selectedFont,
                  fontSize: `${fontSize}px`,
                  color: color
                }}
              />
            ) : (
              <p className="text-gray-400">Enter text to see preview</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!text.trim()}>
          Save Signature
        </Button>
      </div>
    </div>
  );
}
