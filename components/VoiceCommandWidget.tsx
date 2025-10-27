import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { MicrophoneIcon } from './icons';

type VoiceCommandWidgetProps = {
    products: (Product & { stock: number })[];
    onUpdateStock: (productId: string, newQuantity: number, reason: string) => void;
};

const VoiceCommandWidget: React.FC<VoiceCommandWidgetProps> = ({ products, onUpdateStock }) => {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState('Click to speak');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognitionRef.current = recognition;

            recognition.onstart = () => {
                setIsListening(true);
                setStatus('Listening...');
            };

            recognition.onend = () => {
                setIsListening(false);
                setStatus('Click to speak');
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event);
                setStatus(`Error: ${event.error}`);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                processCommand(transcript);
            };
        } else {
            setStatus('Speech recognition not supported.');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const processCommand = (transcript: string) => {
        setStatus(`Heard: "${transcript}"`);
        const commandRegex = /(add|restock|set)\s+(\d+)\s+(.+)/i;
        const match = transcript.match(commandRegex);

        if (!match) {
            setStatus('Command not recognized. Try "add 10 [product name]".');
            return;
        }

        const [, action, quantityStr, productNameStr] = match;
        const quantity = parseInt(quantityStr, 10);

        const foundProduct = products.find(p => p.name.toLowerCase().includes(productNameStr.trim()));

        if (!foundProduct) {
            setStatus(`Product "${productNameStr}" not found.`);
            return;
        }

        let newQuantity = foundProduct.stock;
        if (action === 'add' || action === 'restock') {
            newQuantity += quantity;
        } else if (action === 'set') {
            newQuantity = quantity;
        }

        onUpdateStock(foundProduct.id, newQuantity, 'Voice Command Update');
        setStatus(`Stock for ${foundProduct.name} updated to ${newQuantity}.`);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };
    
    const getStatusColor = () => {
        if (status.startsWith('Error') || status.endsWith('not found.') || status.startsWith('Command not')) return 'text-red-400';
        if (status.startsWith('Stock for')) return 'text-green-400';
        return 'text-hiphop-gray';
    };

    return (
        <div className="flex flex-col items-center space-y-2">
            <button
                onClick={toggleListening}
                className={`relative rounded-full p-4 transition-colors duration-300 ${isListening ? 'bg-hiphop-magenta animate-pulse' : 'bg-hiphop-cyan'}`}
            >
                <MicrophoneIcon className="w-8 h-8 text-hiphop-950" />
            </button>
            <div className={`text-center text-xs p-2 bg-hiphop-950 bg-opacity-80 rounded ${getStatusColor()}`}>
                {status}
            </div>
        </div>
    );
};

export default VoiceCommandWidget;
