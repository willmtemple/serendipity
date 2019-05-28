import { observer } from 'mobx-react';
import * as React from 'react';

import { expression } from 'proto-syntax/dist/lib/lang/syntax/surface';
import { ISizedComponent } from 'src/components/layout/SizedComponent';
import SvgFlex from 'src/components/layout/SvgFlex';
import Statement from '../statement';

interface IProcedureProps {
    parent? : ISizedComponent,

    procedure: expression.Procedure
}

interface IProcedureState {
    bodyHeight: number
}

@observer
class Procedure extends React.Component<IProcedureProps, IProcedureState>
implements ISizedComponent {
    private bodyRef: React.RefObject<SVGGElement>;

    constructor(props : IProcedureProps) {
        super(props)
        this.state = {
            bodyHeight: 0
        }
        this.bodyRef = React.createRef();
    }

    public componentDidUpdate() {
        console.log("Procedure did update")
        // TODO: refactor this force
        this.props.parent!.resize();
    }
    
    public componentDidMount() {
        console.log("Procedure did mount.")
        this.resize();
    }

    public resize() {
        if (this.bodyRef.current) {
            const box = this.bodyRef.current.getBBox();
            if (box.height !== this.state.bodyHeight) {
                console.log("Procedure will be resized!")
                this.setState({
                    bodyHeight: this.bodyRef.current.getBBox().height
                });
            } else {
                // TODO: refactor this force
                this.props.parent!.resize();
            }
        }
    }

    public render() {
        console.log("Procedure is rendering")
        return (
            <g>
                <text>{"<proc>"} [</text>
                <g ref={this.bodyRef} transform="translate(36, 22)">
                    <SvgFlex direction="vertical" parent={this} padding={5}>
                        {this.props.procedure.body.map((s, idx) =>
                            <Statement key={idx} statement={s} />
                        )}
                    </SvgFlex>
                </g>
                <text y={this.state.bodyHeight && (this.state.bodyHeight + 22)}>]</text>
            </g>
        )
    }
}

export default Procedure;