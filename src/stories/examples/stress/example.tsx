import React, { useRef } from "react";

import { TransformComponent, TransformWrapper } from "components";
import { normalizeArgs } from "../../utils";
import exampleImg from "../../assets/small-image.jpg";

import styles from "../../utils/styles.module.css";

export const Example: React.FC<any> = (args: any) => {
  const ref = useRef<any>(null);

  return (
    <TransformWrapper {...normalizeArgs(args)} ref={ref}>
      <TransformComponent contentClass={styles.content}>
        <div className={styles.grid}>
          {Array.from(Array(1000).keys()).map((key) => (
            <img key={key} src={exampleImg} alt="" />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
};
