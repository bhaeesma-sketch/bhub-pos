import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans text-center">
                    <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center border-4 border-destructive/20 shadow-2xl">
                            <AlertTriangle className="w-12 h-12 text-destructive" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black tracking-tighter uppercase font-heading">
                                System <span className="text-destructive underline decoration-8 underline-offset-8">Crash</span>
                            </h1>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                The BHAEES Engine encountered a fatal runtime error. This is often caused by a missing feature or an asynchronous sync conflict.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 text-xs font-mono text-left overflow-x-auto max-h-32 text-slate-300 pos-scrollbar">
                            {this.state.error?.message}
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4">
                            <Button
                                onClick={() => window.location.reload()}
                                className="h-14 rounded-2xl bg-white text-slate-900 font-black text-base shadow-xl hover:scale-105 transition-transform"
                            >
                                <RefreshCw className="mr-2 w-4 h-4" /> RESTART ENGINE
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={this.handleReset}
                                className="text-slate-500 hover:text-destructive hover:bg-destructive/10 h-14 rounded-2xl font-bold"
                            >
                                <Trash2 className="mr-2 w-4 h-4" /> Hard Reset (Clears Cache)
                            </Button>
                        </div>

                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
                            BHAEES PROV RETAIL OS v1.0.4 - ERROR_CODE: {this.state.error?.name}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
